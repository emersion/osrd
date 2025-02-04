pub mod stdcm;

use std::collections::HashMap;

use actix_web::delete;
use actix_web::get;
use actix_web::post;
use actix_web::put;
use actix_web::web::Data;
use actix_web::web::Json;
use actix_web::web::Path;
use actix_web::web::Query;
use actix_web::HttpResponse;
use derivative::Derivative;
use editoast_derive::EditoastError;
use editoast_schemas::train_schedule::TrainScheduleBase;
use itertools::Itertools;
use serde::Deserialize;
use serde::Serialize;
use thiserror::Error;
use utoipa::IntoParams;
use utoipa::ToSchema;

use crate::core::v2::conflict_detection::Conflict;
use crate::core::v2::conflict_detection::ConflictDetectionRequest;
use crate::core::v2::conflict_detection::TrainRequirements;
use crate::core::v2::simulation::SimulationResponse;
use crate::core::AsCoreRequest;
use crate::decl_paginated_response;
use crate::error::Result;
use crate::models::List;
use crate::models::NoParams;
use crate::modelsv2::timetable::Timetable;
use crate::modelsv2::timetable::TimetableWithTrains;
use crate::modelsv2::train_schedule::TrainSchedule;
use crate::modelsv2::train_schedule::TrainScheduleChangeset;
use crate::modelsv2::Create;
use crate::modelsv2::DbConnectionPool;
use crate::modelsv2::DeleteStatic;
use crate::modelsv2::Infra;
use crate::modelsv2::Model;
use crate::modelsv2::Retrieve;
use crate::modelsv2::Update;
use crate::views::pagination::PaginatedResponse;
use crate::views::pagination::PaginationQueryParam;
use crate::views::v2::train_schedule::train_simulation_batch;
use crate::views::v2::train_schedule::TrainScheduleForm;
use crate::views::v2::train_schedule::TrainScheduleResult;
use crate::CoreClient;
use crate::RedisClient;
use crate::RetrieveBatch;

crate::routes! {
    "/v2/timetable" => {
        post,
        list,
        "/{id}" => {
            delete,
            get,
            put,
            conflicts,
            train_schedule,
            stdcm::routes(),
        }
    },
}

editoast_common::schemas! {
    PaginatedResponseOfTimetable,
    TimetableForm,
    TimetableResult,
    TimetableDetailedResult,
    stdcm::schemas(),
}

#[derive(Debug, Error, EditoastError)]
#[editoast_error(base_id = "timetable")]
enum TimetableError {
    #[error("Timetable '{timetable_id}', could not be found")]
    #[editoast_error(status = 404)]
    NotFound { timetable_id: i64 },
    #[error("Infra '{infra_id}', could not be found")]
    #[editoast_error(status = 404)]
    InfraNotFound { infra_id: i64 },
}

/// Creation form for a Timetable
#[derive(Serialize, Deserialize, Derivative, ToSchema)]
#[derivative(Default)]
struct TimetableForm {
    #[serde(default)]
    pub electrical_profile_set_id: Option<i64>,
}

/// Creation form for a Timetable
#[derive(Debug, Default, Serialize, Deserialize, Derivative, ToSchema)]
struct TimetableResult {
    pub id: i64,
    pub electrical_profile_set_id: Option<i64>,
}

impl From<Timetable> for TimetableResult {
    fn from(timetable: Timetable) -> Self {
        Self {
            id: timetable.id,
            electrical_profile_set_id: timetable.electrical_profile_set_id,
        }
    }
}

/// Creation form for a Timetable
#[derive(Debug, Default, Serialize, Deserialize, Derivative, ToSchema)]
struct TimetableDetailedResult {
    #[serde(flatten)]
    #[schema(inline)]
    pub timetable: TimetableResult,
    pub train_ids: Vec<i64>,
}

impl From<TimetableWithTrains> for TimetableDetailedResult {
    fn from(val: TimetableWithTrains) -> Self {
        Self {
            timetable: TimetableResult {
                id: val.id,
                electrical_profile_set_id: val.electrical_profile_set_id,
            },
            train_ids: val.train_ids,
        }
    }
}

#[derive(IntoParams, Deserialize)]
struct TimetableIdParam {
    /// A timetable ID
    id: i64,
}

/// Return a specific timetable with its associated schedules
#[utoipa::path(
    tag = "timetablev2",
    params(TimetableIdParam),
    responses(
        (status = 200, description = "Timetable with train schedules ids", body = TimetableDetailedResult),
        (status = 404, description = "Timetable not found"),
    ),
)]
#[get("")]
async fn get(
    db_pool: Data<DbConnectionPool>,
    timetable_id: Path<TimetableIdParam>,
) -> Result<Json<TimetableDetailedResult>> {
    let timetable_id = timetable_id.id;
    // Return the timetable

    let conn = &mut db_pool.get().await?;
    let timetable = TimetableWithTrains::retrieve_or_fail(conn, timetable_id, || {
        TimetableError::NotFound { timetable_id }
    })
    .await?;

    Ok(Json(timetable.into()))
}

decl_paginated_response!(PaginatedResponseOfTimetable, TimetableResult);

/// Retrieve paginated timetables
#[utoipa::path(
    tag = "timetablev2",
    params(PaginationQueryParam),
    responses(
        (status = 200, description = "List timetables", body = PaginatedResponseOfTimetable),
    ),
)]
#[get("")]
async fn list(
    db_pool: Data<DbConnectionPool>,
    pagination_params: Query<PaginationQueryParam>,
) -> Result<Json<PaginatedResponse<TimetableResult>>> {
    let (page, per_page) = pagination_params
        .validate(1000)?
        .warn_page_size(100)
        .unpack();
    let conn = &mut db_pool.get().await?;
    let timetable = Timetable::list_conn(conn, page, per_page, NoParams).await?;
    Ok(Json(timetable.into()))
}

/// Create a timetable
#[utoipa::path(
    tag = "timetablev2",
    request_body = TimetableForm,
    responses(
        (status = 200, description = "Timetable with train schedules ids", body = TimetableResult),
        (status = 404, description = "Timetable not found"),
    ),
)]
#[post("")]
async fn post(
    db_pool: Data<DbConnectionPool>,
    data: Json<TimetableForm>,
) -> Result<Json<TimetableResult>> {
    let conn = &mut db_pool.get().await?;

    let elec_profile_set = data.into_inner().electrical_profile_set_id;
    let changeset = Timetable::changeset().electrical_profile_set_id(elec_profile_set);
    let timetable = changeset.create(conn).await?;

    Ok(Json(timetable.into()))
}

/// Update a specific timetable
#[utoipa::path(
    tag = "timetablev2",
    params(TimetableIdParam),
    responses(
        (status = 200, description = "Timetable with train schedules ids", body = TimetableDetailedResult),
        (status = 404, description = "Timetable not found"),
    ),
)]
#[put("")]
async fn put(
    db_pool: Data<DbConnectionPool>,
    timetable_id: Path<TimetableIdParam>,
    data: Json<TimetableForm>,
) -> Result<Json<TimetableDetailedResult>> {
    let timetable_id = timetable_id.id;
    let conn = &mut db_pool.get().await?;

    let elec_profile_set = data.into_inner().electrical_profile_set_id;
    let changeset = Timetable::changeset().electrical_profile_set_id(elec_profile_set);
    changeset
        .update_or_fail(conn, timetable_id, || TimetableError::NotFound {
            timetable_id,
        })
        .await?;

    let timetable = TimetableWithTrains::retrieve_or_fail(conn, timetable_id, || {
        TimetableError::NotFound { timetable_id }
    })
    .await?;
    Ok(Json(timetable.into()))
}

/// Delete a timetable
#[utoipa::path(
    tag = "timetablev2",
    params(TimetableIdParam),
    responses(
        (status = 204, description = "No content"),
        (status = 404, description = "Timetable not found"),
    ),
)]
#[delete("")]
async fn delete(
    db_pool: Data<DbConnectionPool>,
    timetable_id: Path<TimetableIdParam>,
) -> Result<HttpResponse> {
    let timetable_id = timetable_id.id;
    let conn = &mut db_pool.get().await?;
    Timetable::delete_static_or_fail(conn, timetable_id, || TimetableError::NotFound {
        timetable_id,
    })
    .await?;
    Ok(HttpResponse::NoContent().finish())
}

/// Create train schedule by batch
#[utoipa::path(
    tag = "timetablev2,train_schedulev2",
    params(TimetableIdParam),
    request_body = Vec<TrainScheduleBase>,
    responses(
        (status = 200, description = "The created train schedules", body = Vec<TrainScheduleResult>)
    )
)]
#[post("train_schedule")]
async fn train_schedule(
    db_pool: Data<DbConnectionPool>,
    timetable_id: Path<TimetableIdParam>,
    data: Json<Vec<TrainScheduleBase>>,
) -> Result<Json<Vec<TrainScheduleResult>>> {
    use crate::modelsv2::CreateBatch;

    let conn = &mut db_pool.get().await?;

    let timetable_id = timetable_id.id;
    TimetableWithTrains::retrieve_or_fail(conn, timetable_id, || TimetableError::NotFound {
        timetable_id,
    })
    .await?;

    let changesets: Vec<TrainScheduleChangeset> = data
        .into_inner()
        .into_iter()
        .map(|ts| TrainScheduleForm {
            timetable_id: Some(timetable_id),
            train_schedule: ts,
        })
        .map_into()
        .collect();

    // Create a batch of train_schedule
    let train_schedule: Vec<_> = TrainSchedule::create_batch(conn, changesets).await?;
    Ok(Json(train_schedule.into_iter().map_into().collect()))
}

#[derive(Debug, Default, Clone, Serialize, Deserialize, IntoParams, ToSchema)]
pub struct InfraIdQueryParam {
    infra_id: i64,
}

/// Retrieve the list of conflict of the timetable (invalid trains are ignored)
#[utoipa::path(
    tag = "timetablev2",
    params(TimetableIdParam, InfraIdQueryParam),
    responses(
        (status = 200, description = "List of conflict", body = Vec<ConflictV2>),
    ),
)]
#[get("/conflicts")]
pub async fn conflicts(
    db_pool: Data<DbConnectionPool>,
    redis_client: Data<RedisClient>,
    core_client: Data<CoreClient>,
    timetable_id: Path<TimetableIdParam>,
    query: Query<InfraIdQueryParam>,
) -> Result<Json<Vec<Conflict>>> {
    let db_pool = db_pool.into_inner();
    let conn = &mut db_pool.clone().get().await?;
    let redis_client = redis_client.into_inner();
    let core_client = core_client.into_inner();
    let timetable_id = timetable_id.into_inner().id;
    let infra_id = query.into_inner().infra_id;

    // 1. Retrieve Timetable / Infra / Trains / Simultion
    let timetable = TimetableWithTrains::retrieve_or_fail(conn, timetable_id, || {
        TimetableError::NotFound { timetable_id }
    })
    .await?;

    let infra = Infra::retrieve_or_fail(conn, infra_id, || TimetableError::InfraNotFound {
        infra_id,
    })
    .await?;

    let (trains, _): (Vec<_>, _) = TrainSchedule::retrieve_batch(conn, timetable.train_ids).await?;

    let simulations = train_simulation_batch(
        db_pool.clone(),
        redis_client.clone(),
        core_client.clone(),
        &trains,
        &infra,
    )
    .await?;

    // 2. Build core request
    let mut trains_requirements = HashMap::with_capacity(trains.len());
    for (train, sim) in trains.into_iter().zip(simulations) {
        let final_output = match sim {
            SimulationResponse::Success { final_output, .. } => final_output,
            _ => continue,
        };
        trains_requirements.insert(
            train.id,
            TrainRequirements {
                start_time: train.start_time,
                spacing_requirements: final_output.spacing_requirements,
                routing_requirements: final_output.routing_requirements,
            },
        );
    }
    let conflict_detection_request = ConflictDetectionRequest {
        trains_requirements,
    };

    // 3. Call core
    let conflicts = conflict_detection_request.fetch(&core_client).await?;

    Ok(Json(conflicts.conflicts))
}

#[cfg(test)]
mod tests {

    use actix_web::test::call_and_read_body_json;
    use actix_web::test::call_service;
    use actix_web::test::TestRequest;
    use rstest::rstest;
    use serde_json::json;
    use std::sync::Arc;

    use super::*;
    use crate::fixtures::tests::db_pool;
    use crate::fixtures::tests::timetable_v2;
    use crate::fixtures::tests::TestFixture;
    use crate::modelsv2::Delete;
    use crate::views::tests::create_test_service;

    #[rstest]
    async fn get_timetable(
        #[future] timetable_v2: TestFixture<Timetable>,
        db_pool: Arc<DbConnectionPool>,
    ) {
        let service = create_test_service().await;
        let timetable = timetable_v2.await;

        let url = format!("/v2/timetable/{}", timetable.id());

        // Should succeed
        let request = TestRequest::get().uri(&url).to_request();
        let response = call_service(&service, request).await;
        assert!(response.status().is_success());

        // Delete the timetable
        assert!(timetable
            .model
            .delete(&mut db_pool.get().await.unwrap())
            .await
            .unwrap());

        // Should fail
        let request = TestRequest::get().uri(&url).to_request();
        let response = call_service(&service, request).await;
        assert!(response.status().is_client_error());
    }

    #[rstest]
    async fn timetable_post(db_pool: Arc<DbConnectionPool>) {
        let service = create_test_service().await;

        // Insert timetable
        let request = TestRequest::post()
            .uri("/v2/timetable")
            .set_json(json!({ "electrical_profil_set_id": None::<i64>}))
            .to_request();
        let response: TimetableResult = call_and_read_body_json(&service, request).await;

        // Delete the timetable
        assert!(
            Timetable::delete_static(&mut db_pool.get().await.unwrap(), response.id)
                .await
                .unwrap()
        );
    }

    #[rstest]
    async fn timetable_delete(#[future] timetable_v2: TestFixture<Timetable>) {
        let timetable = timetable_v2.await;
        let service = create_test_service().await;
        let request = TestRequest::delete()
            .uri(format!("/v2/timetable/{}", timetable.id()).as_str())
            .to_request();
        assert!(call_service(&service, request).await.status().is_success());
    }

    #[rstest]
    async fn timetable_list(#[future] timetable_v2: TestFixture<Timetable>) {
        timetable_v2.await;
        let service = create_test_service().await;
        let request = TestRequest::get().uri("/v2/timetable/").to_request();
        assert!(call_service(&service, request).await.status().is_success());
    }
}
