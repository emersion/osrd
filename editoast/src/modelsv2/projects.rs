use chrono::NaiveDateTime;
use chrono::Utc;
use editoast_derive::ModelV2;
use serde::Deserialize;
use serde::Serialize;
use utoipa::ToSchema;

use crate::error::Result;
use crate::modelsv2::prelude::*;
use crate::modelsv2::DbConnection;
use crate::modelsv2::Document;
use crate::modelsv2::Study;
use crate::views::projects::ProjectError;
use crate::SelectionSettings;

editoast_common::schemas! {
    Project,
    Tags,
}

#[derive(Clone, Debug, Serialize, Deserialize, ModelV2, ToSchema, PartialEq)]
#[model(table = crate::tables::project)]
pub struct Project {
    pub id: i64,
    pub name: String,
    pub objectives: Option<String>,
    pub description: Option<String>,
    pub funders: Option<String>,
    pub budget: Option<i32>,
    pub creation_date: NaiveDateTime,
    pub last_modification: NaiveDateTime,
    #[model(remote = "Vec<Option<String>>")]
    pub tags: Tags,
    #[model(column = crate::tables::project::image_id)]
    pub image: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default, ToSchema, PartialEq)]
pub struct Tags(Vec<String>);

impl Tags {
    pub fn new(value: Vec<String>) -> Self {
        Self(value)
    }
}

impl From<Vec<Option<String>>> for Tags {
    fn from(value: Vec<Option<String>>) -> Self {
        Self(value.into_iter().flatten().collect())
    }
}

impl From<Tags> for Vec<Option<String>> {
    fn from(value: Tags) -> Self {
        value.0.into_iter().map(Some).collect()
    }
}

impl Project {
    /// This function takes a filled project and update to now the last_modification field
    pub async fn update_last_modified(&mut self, conn: &mut DbConnection) -> Result<()> {
        self.last_modification = Utc::now().naive_utc();
        self.save(conn).await?;
        Ok(())
    }

    pub async fn studies_count(&self, conn: &mut DbConnection) -> Result<u64> {
        let project_id = self.id;
        let studies_count = Study::count(
            conn,
            SelectionSettings::new().filter(move || Study::PROJECT_ID.eq(project_id)),
        )
        .await?;
        Ok(studies_count)
    }

    pub async fn update_and_prune_document(
        conn: &mut DbConnection,
        project_changeset: Changeset<Self>,
        project_id: i64,
    ) -> Result<Project> {
        let old_project =
            Project::retrieve_or_fail(conn, project_id, || ProjectError::NotFound { project_id })
                .await?;
        let image_to_delete = if Some(old_project.image) != project_changeset.image {
            old_project.image
        } else {
            None
        };
        let project = project_changeset
            .update_or_fail(conn, project_id, || ProjectError::NotFound { project_id })
            .await?;
        if let Some(image) = image_to_delete {
            // We don't check the result. We don't want to throw an error if the image is used in another project.
            let _ = Document::delete_static(conn, image).await;
        }
        Ok(project)
    }

    pub async fn delete_and_prune_document(
        conn: &mut DbConnection,
        project_id: i64,
    ) -> Result<bool> {
        let project_obj =
            Project::retrieve_or_fail(conn, project_id, || ProjectError::NotFound { project_id })
                .await?;
        let _ = Project::delete_static(conn, project_id).await?;

        if let Some(image) = project_obj.image {
            // We don't check the result. We don't want to throw an error if the image is used in another project.
            let _ = Document::delete_static(conn, image).await;
        }

        Ok(true)
    }
}

#[cfg(test)]
pub mod test {
    use rstest::rstest;
    use std::sync::Arc;

    use super::*;
    use crate::fixtures::tests::db_pool;
    use crate::fixtures::tests::project;
    use crate::fixtures::tests::TestFixture;
    use crate::modelsv2::DbConnectionPool;
    use crate::modelsv2::DeleteStatic;
    use crate::modelsv2::Model;
    use crate::modelsv2::Retrieve;

    #[rstest]
    async fn create_delete_project(
        #[future] project: TestFixture<Project>,
        db_pool: Arc<DbConnectionPool>,
    ) {
        let project = project.await;
        let conn = &mut db_pool.get().await.unwrap();
        // Delete the project
        assert!(Project::delete_static(conn, project.id()).await.unwrap());
        // Second delete should be false
        assert!(!Project::delete_static(conn, project.id()).await.unwrap());
    }

    #[rstest]
    async fn get_project(#[future] project: TestFixture<Project>, db_pool: Arc<DbConnectionPool>) {
        let fixture_project = &project.await.model;
        let conn = &mut db_pool.get().await.unwrap();

        // Get a project
        let project = Project::retrieve(conn, fixture_project.id)
            .await
            .unwrap()
            .unwrap();
        assert_eq!(fixture_project, &project);
        assert!(Project::list(conn, SelectionSettings::new()).await.is_ok());
    }

    #[rstest]
    async fn sort_project(#[future] project: TestFixture<Project>, db_pool: Arc<DbConnectionPool>) {
        let project = project.await;
        let project_2 = project
            .model
            .clone()
            .into_changeset()
            .name(project.model.name.clone() + "_bis");

        let _: TestFixture<Project> = TestFixture::create(project_2, db_pool.clone()).await;

        let conn = &mut db_pool.get().await.unwrap();
        let projects = Project::list(
            conn,
            SelectionSettings::new().order_by(|| Project::NAME.desc()),
        )
        .await
        .unwrap();

        for (p1, p2) in projects.iter().zip(projects.iter().skip(1)) {
            let name_1 = p1.name.to_lowercase();
            let name_2 = p2.name.to_lowercase();
            assert!(name_1.ge(&name_2));
        }
    }

    #[rstest]
    async fn update_project(
        #[future] project: TestFixture<Project>,
        db_pool: Arc<DbConnectionPool>,
    ) {
        let project_fixture = project.await;
        let conn = &mut db_pool.get().await.unwrap();

        // Patch a project
        let mut project = project_fixture.model.clone();
        project.name = "update_name".into();
        project.budget = Some(1000);
        project.save(conn).await.unwrap();
        let project = Project::retrieve(conn, project.id).await.unwrap().unwrap();
        assert_eq!(project.name, String::from("update_name"));
    }
}
