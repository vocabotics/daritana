import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/connection';

interface QuotationAttributes {
  id: string;
  quotation_number: string;
  project_id: string;
  client_id: string;
  prepared_by: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'revised' | 'expired';
  valid_until: Date;
  subtotal: number;
  sst_amount: number;
  total_amount: number;
  discount_amount?: number;
  discount_percentage?: number;
  terms_and_conditions?: string;
  payment_terms?: string;
  notes?: string;
  revision_number: number;
  approved_by?: string;
  approved_at?: Date;
  rejected_reason?: string;
  sent_at?: Date;
  viewed_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

interface QuotationCreationAttributes extends Optional<QuotationAttributes, 'id' | 'created_at' | 'updated_at' | 'discount_amount' | 'discount_percentage' | 'approved_by' | 'approved_at' | 'rejected_reason' | 'sent_at' | 'viewed_at' | 'notes' | 'terms_and_conditions' | 'payment_terms'> {}

class Quotation extends Model<QuotationAttributes, QuotationCreationAttributes> implements QuotationAttributes {
  public id!: string;
  public quotation_number!: string;
  public project_id!: string;
  public client_id!: string;
  public prepared_by!: string;
  public status!: 'draft' | 'sent' | 'approved' | 'rejected' | 'revised' | 'expired';
  public valid_until!: Date;
  public subtotal!: number;
  public sst_amount!: number;
  public total_amount!: number;
  public discount_amount?: number;
  public discount_percentage?: number;
  public terms_and_conditions?: string;
  public payment_terms?: string;
  public notes?: string;
  public revision_number!: number;
  public approved_by?: string;
  public approved_at?: Date;
  public rejected_reason?: string;
  public sent_at?: Date;
  public viewed_at?: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Quotation.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    quotation_number: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },
    project_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id',
      },
    },
    client_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    prepared_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('draft', 'sent', 'approved', 'rejected', 'revised', 'expired'),
      allowNull: false,
      defaultValue: 'draft',
    },
    valid_until: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    subtotal: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    sst_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    total_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    discount_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0,
    },
    discount_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0,
    },
    terms_and_conditions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    payment_terms: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '30 days',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    revision_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    approved_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rejected_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    viewed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Quotation',
    tableName: 'quotations',
    timestamps: true,
    underscored: true,
  }
);

export default Quotation;