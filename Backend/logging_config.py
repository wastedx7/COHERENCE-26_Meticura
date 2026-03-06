"""
Structured Logging Configuration
Provides JSON-structured logging for production monitoring and debugging
Integrates with both FastAPI and Celery
"""
import logging
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict
import traceback

from pythonjsonlogger import jsonlogger


class StructuredLogger:
    """Wrapper for structured logging with context"""
    
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
        self.context: Dict[str, Any] = {}
    
    def set_context(self, **kwargs):
        """Set context that will be added to all logs"""
        self.context.update(kwargs)
    
    def clear_context(self):
        """Clear context"""
        self.context.clear()
    
    def log(self, level: int, message: str, **extra):
        """Log with context"""
        log_data = {
            **self.context,
            **extra,
            "timestamp": datetime.utcnow().isoformat(),
        }
        self.logger.log(level, message, extra=log_data)
    
    def debug(self, message: str, **extra):
        self.log(logging.DEBUG, message, **extra)
    
    def info(self, message: str, **extra):
        self.log(logging.INFO, message, **extra)
    
    def warning(self, message: str, **extra):
        self.log(logging.WARNING, message, **extra)
    
    def error(self, message: str, **extra):
        self.log(logging.ERROR, message, **extra)
    
    def critical(self, message: str, **extra):
        self.log(logging.CRITICAL, message, **extra)
    
    def exception(self, message: str, exc: Exception = None, **extra):
        """Log exception with traceback"""
        extra["error"] = {
            "type": type(exc).__name__ if exc else "Unknown",
            "message": str(exc) if exc else "Unknown",
            "traceback": traceback.format_exc() if exc else traceback.format_exc(),
        }
        self.error(message, **extra)


class JsonFormatter(jsonlogger.JsonFormatter):
    """Custom JSON formatter for structured logging"""
    
    def add_fields(self, log_record: Dict, record: logging.LogRecord, message_dict: Dict):
        """Add custom fields to JSON log"""
        super().add_fields(log_record, record, message_dict)
        
        # Add timestamp in ISO format
        log_record["timestamp"] = datetime.utcnow().isoformat()
        
        # Add service metadata
        log_record["service"] = "budget_watchdog_api"
        log_record["environment"] = "production"
        
        # Add standard fields
        log_record["level"] = record.levelname
        log_record["logger"] = record.name
        log_record["module"] = record.module
        log_record["function"] = record.funcName
        log_record["line"] = record.lineno
        
        # Add request context if available
        try:
            from contextvars import copy_context
            ctx = copy_context()
            if "request_id" in ctx:
                log_record["request_id"] = ctx["request_id"]
            if "user_id" in ctx:
                log_record["user_id"] = ctx["user_id"]
        except:
            pass
        
        # Add extra fields from record
        if hasattr(record, "extra"):
            log_record.update(record.extra)


def configure_logging(
    log_level: str = "INFO",
    log_file: str = "logs/budget_watchdog.log",
    json_format: bool = True
) -> None:
    """
    Configure structured logging for the application
    
    Args:
        log_level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: Path to log file
        json_format: Whether to use JSON format (True for production, False for development)
    """
    
    # Create logs directory if it doesn't exist
    log_path = Path(log_file)
    log_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level))
    
    # Remove existing handlers
    root_logger.handlers.clear()
    
    # Create formatters
    if json_format:
        formatter = JsonFormatter("%(timestamp)s %(level)s %(logger)s %(message)s")
    else:
        formatter = logging.Formatter(
            "[%(asctime)s] %(levelname)-8s [%(name)s:%(funcName)s:%(lineno)d] %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
    
    # Console handler (INFO and above)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)
    
    # File handler (DEBUG and above)
    file_handler = logging.FileHandler(log_file)
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)
    root_logger.addHandler(file_handler)
    
    # Configure third-party libraries
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("celery").setLevel(logging.INFO)
    
    root_logger.info(f"🔧 Logging configured: level={log_level}, file={log_file}, json={json_format}")


# Utility functions for common logging scenarios
def log_pipeline_stage(stage_name: str, status: str, details: Dict = None) -> Dict:
    """
    Log a pipeline stage execution
    
    Args:
        stage_name: Name of the stage (e.g., "anomaly_detection")
        status: Status (running, completed, failed)
        details: Additional details
        
    Returns:
        Log object
    """
    logger = logging.getLogger(__name__)
    
    log_obj = {
        "timestamp": datetime.utcnow().isoformat(),
        "pipeline_stage": stage_name,
        "status": status,
        **(details or {}),
    }
    
    icon_map = {
        "running": "🚀",
        "completed": "✅",
        "failed": "❌",
        "warning": "⚠️",
    }
    icon = icon_map.get(status, "ℹ️")
    
    logger.info(f"{icon} [{stage_name.upper()}] {status.upper()}", extra=log_obj)
    return log_obj


def log_api_request(method: str, path: str, status_code: int, duration_ms: float):
    """
    Log API request
    
    Args:
        method: HTTP method
        path: Request path
        status_code: Response status code
        duration_ms: Request duration in milliseconds
    """
    logger = logging.getLogger("api")
    
    log_obj = {
        "timestamp": datetime.utcnow().isoformat(),
        "type": "http_request",
        "method": method,
        "path": path,
        "status_code": status_code,
        "duration_ms": duration_ms,
    }
    
    logger.info(f"{method} {path} -> {status_code}", extra=log_obj)


def log_database_operation(operation: str, table: str, count: int, duration_ms: float):
    """
    Log database operation
    
    Args:
        operation: Operation type (SELECT, INSERT, UPDATE, DELETE)
        table: Table name
        count: Number of rows affected
        duration_ms: Operation duration in milliseconds
    """
    logger = logging.getLogger("database")
    
    log_obj = {
        "timestamp": datetime.utcnow().isoformat(),
        "type": "db_operation",
        "operation": operation,
        "table": table,
        "row_count": count,
        "duration_ms": duration_ms,
    }
    
    logger.info(f"{operation} {table}: {count} rows ({duration_ms}ms)", extra=log_obj)


def log_ml_prediction(dept_id: int, model_name: str, prediction: Any, confidence: float):
    """
    Log ML prediction
    
    Args:
        dept_id: Department ID
        model_name: Model name
        prediction: Prediction result
        confidence: Confidence score
    """
    logger = logging.getLogger("ml")
    
    log_obj = {
        "timestamp": datetime.utcnow().isoformat(),
        "type": "ml_prediction",
        "department_id": dept_id,
        "model": model_name,
        "prediction": prediction,
        "confidence": confidence,
    }
    
    logger.info(f"[{model_name}] DEPT={dept_id}: {prediction} (confidence={confidence})", extra=log_obj)


def log_alert_generated(alert_type: str, severity: str, dept_id: int, description: str):
    """
    Log alert generation
    
    Args:
        alert_type: Type of alert (anomaly, lapse_risk, etc.)
        severity: Severity level (low, medium, high, critical)
        dept_id: Department ID
        description: Alert description
    """
    logger = logging.getLogger("alerts")
    
    severity_icon = {
        "low": "🟢",
        "medium": "🟡",
        "high": "🟠",
        "critical": "🔴",
    }.get(severity, "⚪")
    
    log_obj = {
        "timestamp": datetime.utcnow().isoformat(),
        "type": "alert",
        "alert_type": alert_type,
        "severity": severity,
        "department_id": dept_id,
        "description": description,
    }
    
    logger.info(f"{severity_icon} [{alert_type.upper()}] DEPT={dept_id}: {description}", extra=log_obj)


# Export public interface
__all__ = [
    "StructuredLogger",
    "JsonFormatter",
    "configure_logging",
    "log_pipeline_stage",
    "log_api_request",
    "log_database_operation",
    "log_ml_prediction",
    "log_alert_generated",
]
