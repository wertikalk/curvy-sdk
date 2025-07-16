export class CurvyError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
    this.name = "CurvyError";
  }
}

export class AnnouncementSyncError extends CurvyError {
  constructor(
    message: string,
    public originalError?: Error,
  ) {
    super(message, "SYNC_ERROR");
    this.name = "AnnouncementSyncError";
  }
}

export class StorageError extends CurvyError {
  constructor(
    message: string,
    public originalError?: Error,
  ) {
    super(message, "STORAGE_ERROR");
    this.name = "StorageError";
  }
}

export class APIError extends CurvyError {
  constructor(
    message: string,
    public statusCode?: number,
    public responseBody?: unknown,
  ) {
    super(message, "API_ERROR");
    this.name = "APIError";
  }
}
