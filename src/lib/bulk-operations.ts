export interface BulkOperationItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  mimeType?: string;
  parentId?: string;
}

export interface BulkOperationProgress {
  isRunning: boolean;
  current: number;
  total: number;
  operation: string;
  errors?: string[];
}

export class BulkOperationsManager {
  private operations: Map<string, BulkOperationProgress> = new Map();

  startOperation(operationId: string, total: number, operation: string) {
    this.operations.set(operationId, {
      isRunning: true,
      current: 0,
      total,
      operation,
      errors: []
    });
  }

  updateProgress(operationId: string, current: number, errors?: string[]) {
    const operation = this.operations.get(operationId);
    if (operation) {
      operation.current = current;
      if (errors) {
        operation.errors = [...(operation.errors || []), ...errors];
      }
    }
  }

  completeOperation(operationId: string) {
    const operation = this.operations.get(operationId);
    if (operation) {
      operation.isRunning = false;
    }
  }

  getOperation(operationId: string): BulkOperationProgress | undefined {
    return this.operations.get(operationId);
  }

  clearOperation(operationId: string) {
    this.operations.delete(operationId);
  }
}

export const bulkOperationsManager = new BulkOperationsManager();