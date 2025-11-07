/**
 * Document Review Service
 * Handles document reviews, versions, and collaboration
 * Uses IndexedDB for local persistence (can be replaced with backend API)
 */

import { DocumentVersion } from '@/components/documents/DocumentVersionControl'

// IndexedDB setup for local persistence
class DocumentReviewDatabase {
  private db: IDBDatabase | null = null
  private readonly DB_NAME = 'DocumentReviewDB'
  private readonly VERSION = 1

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Documents store
        if (!db.objectStoreNames.contains('documents')) {
          const documentStore = db.createObjectStore('documents', { keyPath: 'id', autoIncrement: true })
          documentStore.createIndex('name', 'name', { unique: false })
          documentStore.createIndex('status', 'status', { unique: false })
        }

        // Versions store
        if (!db.objectStoreNames.contains('versions')) {
          const versionStore = db.createObjectStore('versions', { keyPath: 'id' })
          versionStore.createIndex('documentId', 'documentId', { unique: false })
          versionStore.createIndex('version', 'version', { unique: false })
        }

        // Reviews store
        if (!db.objectStoreNames.contains('reviews')) {
          const reviewStore = db.createObjectStore('reviews', { keyPath: 'id', autoIncrement: true })
          reviewStore.createIndex('documentId', 'documentId', { unique: false })
          reviewStore.createIndex('status', 'status', { unique: false })
        }

        // Chat messages store
        if (!db.objectStoreNames.contains('messages')) {
          const messageStore = db.createObjectStore('messages', { keyPath: 'id' })
          messageStore.createIndex('reviewId', 'reviewId', { unique: false })
          messageStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        // Annotations store
        if (!db.objectStoreNames.contains('annotations')) {
          const annotationStore = db.createObjectStore('annotations', { keyPath: 'id' })
          annotationStore.createIndex('documentId', 'documentId', { unique: false })
          annotationStore.createIndex('versionId', 'versionId', { unique: false })
        }
      }
    })
  }

  async getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    if (!this.db) await this.init()
    const transaction = this.db!.transaction([storeName], mode)
    return transaction.objectStore(storeName)
  }

  // Document operations
  async saveDocument(document: any): Promise<number> {
    const store = await this.getStore('documents', 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.add(document)
      request.onsuccess = () => resolve(request.result as number)
      request.onerror = () => reject(request.error)
    })
  }

  async getDocument(id: number): Promise<any> {
    const store = await this.getStore('documents')
    return new Promise((resolve, reject) => {
      const request = store.get(id)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getAllDocuments(): Promise<any[]> {
    const store = await this.getStore('documents')
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Version operations
  async saveVersion(version: DocumentVersion): Promise<string> {
    const store = await this.getStore('versions', 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.add(version)
      request.onsuccess = () => resolve(request.result as string)
      request.onerror = () => reject(request.error)
    })
  }

  async getVersions(documentId: string): Promise<DocumentVersion[]> {
    const store = await this.getStore('versions')
    const index = store.index('documentId')
    return new Promise((resolve, reject) => {
      const request = index.getAll(documentId)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Review operations
  async saveReview(review: any): Promise<number> {
    const store = await this.getStore('reviews', 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.add(review)
      request.onsuccess = () => resolve(request.result as number)
      request.onerror = () => reject(request.error)
    })
  }

  async getActiveReviews(): Promise<any[]> {
    const store = await this.getStore('reviews')
    const index = store.index('status')
    return new Promise((resolve, reject) => {
      const request = index.getAll('active')
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Message operations
  async saveMessage(message: any): Promise<void> {
    const store = await this.getStore('messages', 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.add(message)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getMessages(reviewId: string): Promise<any[]> {
    const store = await this.getStore('messages')
    const index = store.index('reviewId')
    return new Promise((resolve, reject) => {
      const request = index.getAll(reviewId)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Annotation operations
  async saveAnnotation(annotation: any): Promise<void> {
    const store = await this.getStore('annotations', 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.add(annotation)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getAnnotations(documentId: string, versionId?: string): Promise<any[]> {
    const store = await this.getStore('annotations')
    const index = versionId ? store.index('versionId') : store.index('documentId')
    return new Promise((resolve, reject) => {
      const request = index.getAll(versionId || documentId)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
}

// WebSocket simulation for real-time features
class WebSocketSimulator {
  private listeners: Map<string, Set<Function>> = new Map()
  private isConnected = false

  connect(): void {
    this.isConnected = true
    console.log('WebSocket simulator connected')
  }

  disconnect(): void {
    this.isConnected = false
    console.log('WebSocket simulator disconnected')
  }

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  off(event: string, callback: Function): void {
    this.listeners.get(event)?.delete(callback)
  }

  emit(event: string, data: any): void {
    // Simulate network delay
    setTimeout(() => {
      this.listeners.get(event)?.forEach(callback => callback(data))
    }, 50)
  }

  // Simulate incoming messages
  simulateIncomingMessage(message: any): void {
    this.emit('message', message)
  }

  simulateParticipantJoin(participant: any): void {
    this.emit('participant-joined', participant)
  }

  simulateParticipantLeave(participantId: string): void {
    this.emit('participant-left', participantId)
  }
}

// Main Document Review Service
class DocumentReviewService {
  private db: DocumentReviewDatabase
  private ws: WebSocketSimulator
  private peerConnections: Map<string, RTCPeerConnection> = new Map()
  private localStream: MediaStream | null = null

  constructor() {
    this.db = new DocumentReviewDatabase()
    this.ws = new WebSocketSimulator()
    this.init()
  }

  private async init() {
    await this.db.init()
    this.ws.connect()
    await this.loadInitialData()
  }

  // Load or create initial sample data
  private async loadInitialData() {
    const documents = await this.db.getAllDocuments()
    
    if (documents.length === 0) {
      // Create sample documents
      const sampleDocs = [
        {
          name: 'KLCC Tower Floor Plan',
          type: 'DWG',
          size: 2456789,
          status: 'in_review',
          lastModified: new Date(),
          modifiedBy: 'Sarah Designer',
          version: '1.1.0',
          reviewers: 3,
          activeReview: true,
        },
        {
          name: 'Structural Analysis Report',
          type: 'PDF',
          size: 1234567,
          status: 'approved',
          lastModified: new Date(Date.now() - 24 * 60 * 60 * 1000),
          modifiedBy: 'Mike Engineer',
          version: '2.0.0',
          reviewers: 2,
        },
        {
          name: 'Electrical Layout',
          type: 'DWG',
          size: 987654,
          status: 'draft',
          lastModified: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          modifiedBy: 'John Architect',
          version: '0.5.0',
          reviewers: 0,
        },
      ]

      for (const doc of sampleDocs) {
        await this.db.saveDocument(doc)
      }
    }
  }

  // Document Management
  async uploadDocument(file: File): Promise<number> {
    const document = {
      name: file.name,
      type: file.name.split('.').pop()?.toUpperCase() || 'FILE',
      size: file.size,
      status: 'draft',
      lastModified: new Date(),
      modifiedBy: 'Current User',
      version: '1.0.0',
      reviewers: 0,
      content: await this.fileToBase64(file),
    }

    return await this.db.saveDocument(document)
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  async getDocuments(): Promise<any[]> {
    return await this.db.getAllDocuments()
  }

  async getDocument(id: number): Promise<any> {
    return await this.db.getDocument(id)
  }

  // Version Control
  async createVersion(documentId: string, versionData: Partial<DocumentVersion>): Promise<string> {
    const version: DocumentVersion = {
      id: `v${Date.now()}`,
      documentId,
      version: versionData.version || '1.0.0',
      branch: versionData.branch || 'main',
      author: versionData.author || {
        id: '1',
        name: 'Current User',
        email: 'user@daritana.com',
      },
      timestamp: new Date(),
      message: versionData.message || 'Version update',
      changes: versionData.changes || {
        additions: 0,
        deletions: 0,
        modifications: 0,
        files: [],
      },
      status: 'draft',
      reviewers: [],
      tags: versionData.tags || [],
      metadata: versionData.metadata || {
        fileSize: 0,
        checksum: '',
        format: 'DWG',
      },
      permissions: {
        canEdit: true,
        canReview: true,
        canApprove: true,
        canMerge: true,
        canDelete: false,
      },
    }

    return await this.db.saveVersion(version)
  }

  async getVersions(documentId: string): Promise<DocumentVersion[]> {
    return await this.db.getVersions(documentId)
  }

  // Review Sessions
  async startReviewSession(documentId: string): Promise<number> {
    const review = {
      documentId,
      startTime: new Date(),
      status: 'active',
      participants: [],
      isRecording: false,
    }

    const reviewId = await this.db.saveReview(review)
    
    // Notify other users
    this.ws.emit('review-started', { reviewId, documentId })
    
    return reviewId
  }

  async joinReviewSession(reviewId: number, participant: any): Promise<void> {
    this.ws.simulateParticipantJoin(participant)
  }

  async leaveReviewSession(reviewId: number, participantId: string): Promise<void> {
    this.ws.simulateParticipantLeave(participantId)
  }

  async getActiveReviews(): Promise<any[]> {
    return await this.db.getActiveReviews()
  }

  // Chat & Messaging
  async sendMessage(reviewId: string, message: string, userId: string): Promise<void> {
    const chatMessage = {
      id: `msg_${Date.now()}`,
      reviewId,
      userId,
      content: message,
      timestamp: new Date(),
      type: 'text',
    }

    await this.db.saveMessage(chatMessage)
    this.ws.simulateIncomingMessage(chatMessage)
  }

  async getMessages(reviewId: string): Promise<any[]> {
    return await this.db.getMessages(reviewId)
  }

  // Annotations
  async addAnnotation(documentId: string, annotation: any): Promise<void> {
    const fullAnnotation = {
      ...annotation,
      id: `ann_${Date.now()}`,
      timestamp: new Date(),
    }

    await this.db.saveAnnotation(fullAnnotation)
    this.ws.emit('annotation-added', fullAnnotation)
  }

  async getAnnotations(documentId: string, versionId?: string): Promise<any[]> {
    return await this.db.getAnnotations(documentId, versionId)
  }

  // WebRTC for Audio/Video
  async initializeMediaStream(constraints: MediaStreamConstraints): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints)
      return this.localStream
    } catch (error) {
      console.error('Failed to get media stream:', error)
      throw error
    }
  }

  async createPeerConnection(peerId: string): Promise<RTCPeerConnection> {
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    }

    const pc = new RTCPeerConnection(configuration)
    
    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream!)
      })
    }

    this.peerConnections.set(peerId, pc)
    return pc
  }

  async shareScreen(): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      })
      return stream
    } catch (error) {
      console.error('Failed to share screen:', error)
      throw error
    }
  }

  // Recording
  startRecording(stream: MediaStream): MediaRecorder {
    const recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
    })

    const chunks: Blob[] = []
    
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data)
      }
    }

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)
      // Save recording
      this.saveRecording(blob)
    }

    recorder.start()
    return recorder
  }

  private async saveRecording(blob: Blob): Promise<void> {
    // Convert to base64 and save
    const reader = new FileReader()
    reader.readAsDataURL(blob)
    reader.onloadend = () => {
      const base64data = reader.result
      // Save to IndexedDB or upload to server
      console.log('Recording saved')
    }
  }

  // Real-time subscriptions
  onMessage(callback: (message: any) => void): void {
    this.ws.on('message', callback)
  }

  onParticipantJoined(callback: (participant: any) => void): void {
    this.ws.on('participant-joined', callback)
  }

  onParticipantLeft(callback: (participantId: string) => void): void {
    this.ws.on('participant-left', callback)
  }

  onAnnotationAdded(callback: (annotation: any) => void): void {
    this.ws.on('annotation-added', callback)
  }

  // Cleanup
  disconnect(): void {
    this.ws.disconnect()
    this.peerConnections.forEach(pc => pc.close())
    this.peerConnections.clear()
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
    }
  }
}

// Export singleton instance
export const documentReviewService = new DocumentReviewService()

// Export types for use in components
export type { DocumentVersion }