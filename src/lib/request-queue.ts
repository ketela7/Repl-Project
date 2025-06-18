/**
 * Request queue system to manage concurrent API calls
 * Prevents overwhelming the Google Drive API with too many simultaneous requests
 */

interface QueuedRequest<T = any> {
  id: string;
  request: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
  priority: 'high' | 'medium' | 'low';
  timestamp: number;
}

class RequestQueue {
  private queue: QueuedRequest[] = [];
  private activeRequests = new Set<string>();
  private maxConcurrent = 3; // Limit concurrent requests
  private isProcessing = false;

  async enqueue<T>(
    id: string,
    request: () => Promise<T>,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<T> {
    // Cancel existing request with same ID if exists
    this.cancel(id);

    return new Promise<T>((resolve, reject) => {
      const queuedRequest: QueuedRequest<T> = {
        id,
        request,
        resolve,
        reject,
        priority,
        timestamp: Date.now(),
      };

      // Insert based on priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const insertIndex = this.queue.findIndex(
        item => priorityOrder[item.priority] > priorityOrder[priority]
      );

      if (insertIndex === -1) {
        this.queue.push(queuedRequest);
      } else {
        this.queue.splice(insertIndex, 0, queuedRequest);
      }

      this.processQueue();
    });
  }

  cancel(id: string): void {
    // Remove from queue
    this.queue = this.queue.filter(item => item.id !== id);
    
    // Note: We can't cancel active requests, but we prevent their results from being processed
    this.activeRequests.delete(id);
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.activeRequests.size >= this.maxConcurrent) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0 && this.activeRequests.size < this.maxConcurrent) {
      const queuedRequest = this.queue.shift()!;
      this.activeRequests.add(queuedRequest.id);

      // Process request without blocking the queue
      this.executeRequest(queuedRequest).finally(() => {
        this.activeRequests.delete(queuedRequest.id);
        this.processQueue();
      });
    }

    this.isProcessing = false;
  }

  private async executeRequest<T>(queuedRequest: QueuedRequest<T>): Promise<void> {
    try {
      const result = await queuedRequest.request();
      
      // Only resolve if request hasn't been cancelled
      if (this.activeRequests.has(queuedRequest.id)) {
        queuedRequest.resolve(result);
      }
    } catch (error) {
      // Only reject if request hasn't been cancelled
      if (this.activeRequests.has(queuedRequest.id)) {
        queuedRequest.reject(error);
      }
    }
  }

  getQueueStats(): { queueSize: number; activeRequests: number } {
    return {
      queueSize: this.queue.length,
      activeRequests: this.activeRequests.size,
    };
  }

  clear(): void {
    this.queue = [];
    this.activeRequests.clear();
  }
}

// Export singleton instance
export const requestQueue = new RequestQueue();