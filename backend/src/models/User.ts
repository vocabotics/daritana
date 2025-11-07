import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'
import argon2 from 'argon2'

export enum UserRole {
  CLIENT = 'client',
  STAFF = 'staff',
  CONTRACTOR = 'contractor',
  PROJECT_LEAD = 'project_lead',
  DESIGNER = 'designer',
  ADMIN = 'admin'
}

export enum UserStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DELETED = 'deleted'
}

export interface UserAttributes {
  id: string
  email: string
  password: string
  firstName: string
  lastName: string
  role: UserRole
  status: UserStatus
  phoneNumber?: string
  companyName?: string
  designation?: string
  profileImage?: string
  emailVerified: boolean
  emailVerificationToken?: string
  passwordResetToken?: string
  passwordResetExpires?: Date
  lastLogin?: Date
  loginAttempts: number
  lockUntil?: Date
  preferences?: Record<string, any>
  metadata?: Record<string, any>
  createdAt?: Date
  updatedAt?: Date
}

export interface UserCreationAttributes extends Optional<UserAttributes, 
  'id' | 'emailVerified' | 'loginAttempts' | 'status' | 'createdAt' | 'updatedAt'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  // Declare the attributes using the declare keyword to avoid shadowing
  declare id: string
  declare email: string
  declare password: string
  declare firstName: string
  declare lastName: string
  declare role: UserRole
  declare status: UserStatus
  declare phoneNumber?: string
  declare companyName?: string
  declare designation?: string
  declare profileImage?: string
  declare emailVerified: boolean
  declare emailVerificationToken?: string
  declare passwordResetToken?: string
  declare passwordResetExpires?: Date
  declare lastLogin?: Date
  declare loginAttempts: number
  declare lockUntil?: Date
  declare preferences?: Record<string, any>
  declare metadata?: Record<string, any>
  
  declare readonly createdAt: Date
  declare readonly updatedAt: Date

  // Virtual field for full name
  public get fullName(): string {
    return `${this.firstName} ${this.lastName}`
  }

  // Check if account is locked
  public get isLocked(): boolean {
    return !!(this.lockUntil && this.lockUntil > new Date())
  }

  // Instance methods
  public async validatePassword(password: string): Promise<boolean> {
    if (!this.password) {
      throw new Error('Password field is missing from user instance')
    }
    return argon2.verify(this.password, password)
  }

  public async incrementLoginAttempts(): Promise<void> {
    // Reset attempts if lock has expired
    if (this.lockUntil && this.lockUntil < new Date()) {
      await this.update({
        loginAttempts: 1,
        lockUntil: undefined
      })
    } else {
      const attempts = this.loginAttempts + 1
      const updates: Partial<UserAttributes> = { loginAttempts: attempts }
      
      // Lock account after 5 attempts for 2 hours
      if (attempts >= 5 && !this.lockUntil) {
        const lockTime = new Date()
        lockTime.setHours(lockTime.getHours() + 2)
        updates.lockUntil = lockTime
      }
      
      await this.update(updates)
    }
  }

  public async resetLoginAttempts(): Promise<void> {
    if (this.loginAttempts > 0 || this.lockUntil) {
      await this.update({
        loginAttempts: 0,
        lockUntil: undefined,
        lastLogin: new Date()
      })
    }
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM(...Object.values(UserRole)),
      allowNull: false,
      defaultValue: UserRole.CLIENT
    },
    status: {
      type: DataTypes.ENUM(...Object.values(UserStatus)),
      allowNull: false,
      defaultValue: UserStatus.PENDING
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    designation: {
      type: DataTypes.STRING,
      allowNull: true
    },
    profileImage: {
      type: DataTypes.STRING,
      allowNull: true
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    emailVerificationToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    passwordResetToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    loginAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lockUntil: {
      type: DataTypes.DATE,
      allowNull: true
    },
    preferences: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    indexes: [
      { fields: ['email'] },
      { fields: ['role'] },
      { fields: ['status'] },
      { fields: ['emailVerificationToken'] },
      { fields: ['passwordResetToken'] }
    ],
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await argon2.hash(user.password)
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password') && user.password) {
          user.password = await argon2.hash(user.password)
        }
      }
    }
  }
)

export default User