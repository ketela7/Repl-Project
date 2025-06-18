/**
 * API call optimizer for free tier platforms
 * Minimizes function invocations and execution time
 */

interface BatchableRequest {
  id: string;
  type: 'files' | 'details' | 'operation';
  params: any;
  resolve: (result: any) => void;
  reject: (error: any) => void;
}

class APIOptimizer {
  private requestQueue = new Map<string, BatchableRequest>();
  private batchTimer: NodeJS.Timeout | null = null;
  private readonly batchDelay = 50; // Very fast batching for free tier
  private maxBatchSize = 10; // Limit to avoid timeout

  // Queue request for batching
  enqueueRequest<T>(type: string, params: any): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const id = `${type}-${JSON.stringify(params)}-${Date.now()}`;
      
      this.requestQueue.set(id, {
        id,
        type: type as any,
        params,
        resolve,
        reject
      });

      this.scheduleBatch();
    });
  }

  private scheduleBatch() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    this.batchTimer = setTimeout(() => {
      this.processBatch();
    }, this.batchDelay);
  }

  private async processBatch() {
    if (this.requestQueue.size === 0) return;

    const requests = Array.from(this.requestQueue.values());
    this.requestQueue.clear();

    // Group by type for efficient batching
    const grouped = this.groupRequestsByType(requests);

    // Process each group
    await Promise.all([
      this.processFileRequests(grouped.files || []),
      this.processDetailRequests(grouped.details || []),
      this.processOperationRequests(grouped.operation || [])
    ]);
  }

  private groupRequestsByType(requests: BatchableRequest[]): Record<string, BatchableRequest[]> {
    return requests.reduce((groups, request) => {
      if (!groups[request.type]) {
        groups[request.type] = [];
      }
      groups[request.type].push(request);
      return groups;
    }, {} as Record<string, BatchableRequest[]>);
  }

  private async processFileRequests(requests: BatchableRequest[]) {
    if (requests.length === 0) return;

    try {
      // Combine multiple file listing requests
      const combinedParams = this.combineFileParams(requests.map(r => r.params));
      
      const response = await fetch('/api/drive/batch-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: combinedParams })
      });

      if (!response.ok) {
        throw new Error(`Batch request failed: ${response.status}`);
      }

      const results = await response.json();
      
      // Distribute results back to individual requests
      requests.forEach((request, index) => {
        const result = results[index];
        if (result.error) {
          request.reject(new Error(result.error));
        } else {
          request.resolve(result.data);
        }
      });
    } catch (error) {
      requests.forEach(request => request.reject(error));
    }
  }

  private async processDetailRequests(requests: BatchableRequest[]) {
    if (requests.length === 0) return;

    try {
      const fileIds = requests.map(r => r.params.fileId);
      
      const response = await fetch('/api/drive/batch-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileIds })
      });

      if (!response.ok) {
        throw new Error(`Batch details failed: ${response.status}`);
      }

      const results = await response.json();
      
      requests.forEach(request => {
        const fileId = request.params.fileId;
        const result = results[fileId];
        
        if (result?.error) {
          request.reject(new Error(result.error));
        } else {
          request.resolve(result);
        }
      });
    } catch (error) {
      requests.forEach(request => request.reject(error));
    }
  }

  private async processOperationRequests(requests: BatchableRequest[]) {
    if (requests.length === 0) return;

    try {
      const operations = requests.map(r => ({
        fileId: r.params.fileId,
        action: r.params.action,
        data: r.params.data
      }));
      
      const response = await fetch('/api/drive/batch-operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operations })
      });

      if (!response.ok) {
        throw new Error(`Batch operations failed: ${response.status}`);
      }

      const results = await response.json();
      
      requests.forEach((request, index) => {
        const result = results[index];
        if (result?.error) {
          request.reject(new Error(result.error));
        } else {
          request.resolve(result);
        }
      });
    } catch (error) {
      requests.forEach(request => request.reject(error));
    }
  }

  private combineFileParams(paramsList: any[]): any[] {
    // Deduplicate similar requests
    const seen = new Set();
    return paramsList.filter(params => {
      const key = JSON.stringify(params);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Optimize single API call for multiple data
  async getOptimizedFolderData(folderId: string) {
    return this.enqueueRequest('files', { 
      parentId: folderId,
      includeBreadcrumbs: true,
      includePermissions: false, // Skip heavy data
      pageSize: 50 // Optimal size for free tier
    });
  }

  // Get stats for monitoring
  getStats() {
    return {
      queueSize: this.requestQueue.size,
      hasPendingBatch: this.batchTimer !== null
    };
  }

  clear() {
    this.requestQueue.clear();
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }

  setBatchSize(newBatchSize: number): void {
    this.maxBatchSize = Math.min(20, Math.max(3, newBatchSize));
  }
}

export const apiOptimizer = new APIOptimizer();