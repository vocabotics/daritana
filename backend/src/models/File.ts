import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  CreatedAt,
  UpdatedAt,
  BeforeCreate,
  DefaultScope,
  Scopes
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { User } from './User';
import { Project } from './Project';

export enum FileStatus {
  UPLOADING = 'uploading',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DELETED = 'deleted'
}

export enum FileProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
  MICROSOFT = 'microsoft',
  CLOUDINARY = 'cloudinary'
}

@DefaultScope(() => ({
  where: { status: FileStatus.ACTIVE },
  order: [['createdAt', 'DESC']]
}))
@Scopes(() => ({
  withDeleted: {
    where: {}
  },
  byProject: (projectId: string) => ({
    where: { projectId }
  }),
  byUser: (userId: string) => ({
    where: { uploadedBy: userId }
  })
}))
@Table({
  tableName: 'files',
  timestamps: true
})
export class File extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true
  })
  declare id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false
  })
  declare name: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true
  })
  declare filename: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  declare originalName: string;

  @Column({
    type: DataType.STRING,
    allowNull: false
  })
  declare mimeType: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  declare size: number;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  declare path: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  declare url: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  declare thumbnailUrl: string;

  @Column({
    type: DataType.ENUM(...Object.values(FileProvider)),
    defaultValue: FileProvider.LOCAL
  })
  declare provider: FileProvider;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  declare cloudId: string;

  @Column({
    type: DataType.JSON,
    allowNull: true
  })
  declare metadata: any;

  @Column({
    type: DataType.ENUM(...Object.values(FileStatus)),
    defaultValue: FileStatus.ACTIVE
  })
  declare status: FileStatus;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  declare description: string;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    defaultValue: []
  })
  declare tags: string[];

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false
  })
  declare uploadedBy: string;

  @ForeignKey(() => Project)
  @Column({
    type: DataType.UUID,
    allowNull: true
  })
  declare projectId: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  declare folder: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  declare isPublic: boolean;

  @Column({
    type: DataType.JSON,
    allowNull: true
  })
  declare shareSettings: {
    sharedWith?: string[];
    shareLink?: string;
    expiresAt?: Date;
  };

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0
  })
  declare downloadCount: number;

  @Column({
    type: DataType.DATE,
    allowNull: true
  })
  declare lastAccessedAt: Date;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  // Associations
  @BelongsTo(() => User, 'uploadedBy')
  declare uploader: User;

  @BelongsTo(() => Project, 'projectId')
  declare project: Project;

  @BeforeCreate
  static generateFilename(instance: File) {
    if (!instance.filename) {
      const ext = instance.originalName?.split('.').pop() || '';
      instance.filename = `${uuidv4()}${ext ? `.${ext}` : ''}`;
    }
  }

  // Instance methods
  async incrementDownloadCount() {
    this.downloadCount += 1;
    this.lastAccessedAt = new Date();
    await this.save();
  }

  async archive() {
    this.status = FileStatus.ARCHIVED;
    await this.save();
  }

  async softDelete() {
    this.status = FileStatus.DELETED;
    await this.save();
  }

  async restore() {
    this.status = FileStatus.ACTIVE;
    await this.save();
  }

  isImage(): boolean {
    return this.mimeType.startsWith('image/');
  }

  isDocument(): boolean {
    return this.mimeType.includes('pdf') || 
           this.mimeType.includes('document') || 
           this.mimeType.includes('text');
  }

  isVideo(): boolean {
    return this.mimeType.startsWith('video/');
  }

  isAudio(): boolean {
    return this.mimeType.startsWith('audio/');
  }
}