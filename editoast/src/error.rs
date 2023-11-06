use actix_web::{error::JsonPayloadError, http::StatusCode, HttpResponse, ResponseError};
use colored::Colorize;
use diesel::result::Error as DieselError;
use redis::RedisError;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::backtrace::Backtrace;
use std::collections::HashMap;
use std::result::Result as StdResult;
use std::{
    error::Error,
    fmt::{Display, Formatter},
};
use utoipa::ToSchema;

crate::schemas! {
    InternalError,
}

pub type Result<T> = StdResult<T, InternalError>;

/// Trait for all errors that can be returned by editoast
pub trait EditoastError: Error + Send + Sync {
    fn get_status(&self) -> StatusCode;

    fn get_type(&self) -> &str;

    fn context(&self) -> HashMap<String, Value> {
        Default::default()
    }
}

#[derive(Serialize, Deserialize)]
#[serde(remote = "StatusCode")]
struct StatusCodeRemoteDef(#[serde(getter = "StatusCode::as_u16")] u16);

impl From<StatusCodeRemoteDef> for StatusCode {
    fn from(def: StatusCodeRemoteDef) -> Self {
        StatusCode::from_u16(def.0).unwrap()
    }
}

fn default_status_code() -> StatusCode {
    StatusCode::INTERNAL_SERVER_ERROR
}

#[derive(Debug, Serialize, Deserialize, ToSchema, PartialEq)]
pub struct InternalError {
    #[serde(with = "StatusCodeRemoteDef", default = "default_status_code")]
    #[schema(value_type = u16, minimum = 100, maximum = 599)]
    pub status: StatusCode,
    #[serde(rename = "type")]
    pub error_type: String,
    pub context: HashMap<String, Value>,
    pub message: String,
}

impl InternalError {
    pub fn get_type(&self) -> &str {
        &self.error_type
    }

    pub fn get_status(&self) -> StatusCode {
        self.status
    }

    pub fn set_status(&mut self, status: StatusCode) {
        self.status = status;
    }

    pub fn get_context(&self) -> &HashMap<String, Value> {
        &self.context
    }

    pub fn with_context<S: AsRef<str>, V: Into<Value>>(mut self, key: S, value: V) -> Self {
        self.context.insert(key.as_ref().into(), value.into());
        self
    }
}

impl Error for InternalError {}

impl Display for InternalError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl<T: EditoastError> From<T> for InternalError {
    fn from(err: T) -> Self {
        InternalError {
            status: err.get_status(),
            error_type: err.get_type().to_owned(),
            context: err.context(),
            message: err.to_string(),
        }
    }
}

impl ResponseError for InternalError {
    fn status_code(&self) -> StatusCode {
        self.status
    }

    fn error_response(&self) -> HttpResponse {
        log::error!(
            "[{}] {}: {}",
            self.error_type.bold(),
            self.message,
            Backtrace::capture() // won't log unless RUST_BACKTRACE=1
        );
        HttpResponse::build(self.status).json(self)
    }
}

/// Handle all diesel errors
impl EditoastError for DieselError {
    fn get_status(&self) -> StatusCode {
        StatusCode::INTERNAL_SERVER_ERROR
    }

    fn get_type(&self) -> &str {
        "editoast:DieselError"
    }
}

/// Handle all redis errors
impl EditoastError for RedisError {
    fn get_status(&self) -> StatusCode {
        StatusCode::INTERNAL_SERVER_ERROR
    }

    fn get_type(&self) -> &str {
        "editoast:RedisError"
    }
}

/// Handle all json errors
impl EditoastError for JsonPayloadError {
    fn get_status(&self) -> StatusCode {
        StatusCode::BAD_REQUEST
    }

    fn get_type(&self) -> &str {
        "editoast:JsonError"
    }

    fn context(&self) -> HashMap<String, Value> {
        [("cause".into(), json!(self.to_string()))].into()
    }
}

/// Handle database pool errors
impl EditoastError for diesel_async::pooled_connection::deadpool::PoolError {
    fn get_status(&self) -> StatusCode {
        StatusCode::INTERNAL_SERVER_ERROR
    }

    fn get_type(&self) -> &str {
        "editoast:DatabasePoolError"
    }
}

impl EditoastError for reqwest::Error {
    fn get_status(&self) -> StatusCode {
        StatusCode::INTERNAL_SERVER_ERROR
    }

    fn get_type(&self) -> &str {
        "editoast:ReqwestError"
    }
}
