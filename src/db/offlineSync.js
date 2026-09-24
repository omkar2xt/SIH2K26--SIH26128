/**
 * PASHU-RAKSHA — IndexedDB-backed Offline Sync Queue
 * Implements persistent queue for offline operations using localforage.
 */

import localforage from 'localforage';
import { v4 as uuidv4 } from 'uuid';

localforage.config({
  name: 'PashuRaksha',
  storeName: 'syncQueue'
});

export const offlineSync = {
  /**
   * Queue an operation for later sync
   */
  async queueOperation(entityName, actionType, payload) {
    const operationId = uuidv4();
    const operation = {
      id: operationId,
      entityName,
      actionType,
      payload,
      status: 'PENDING',
      queuedAt: new Date().toISOString()
    };
    
    await localforage.setItem(operationId, operation);
    return operationId;
  },

  /**
   * Retrieve all pending operations
   */
  async getPendingQueue() {
    const queue = [];
    await localforage.iterate((value, key) => {
      if (value.status === 'PENDING' || value.status === 'FAILED') {
        queue.push(value);
      }
    });
    // Sort by queuedAt ascending
    return queue.sort((a, b) => new Date(a.queuedAt) - new Date(b.queuedAt));
  },

  /**
   * Mark an operation as synced
   */
  async markOperationSynced(operationId) {
    await localforage.removeItem(operationId);
  },

  /**
   * Mark an operation as failed with reason
   */
  async markOperationFailed(operationId, error) {
    const op = await localforage.getItem(operationId);
    if (op) {
      op.status = 'FAILED';
      op.error = error;
      op.updatedAt = new Date().toISOString();
      await localforage.setItem(operationId, op);
    }
  },

  /**
   * Clear the entire queue (for reset)
   */
  async clearQueue() {
    await localforage.clear();
  }
};
