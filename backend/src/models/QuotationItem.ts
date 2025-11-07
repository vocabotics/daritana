import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/connection';

interface QuotationItemAttributes {
  id: string;
  quotation_id: string;
  item_code?: string;
  description: string;
  category?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  sst_rate: number;
  sst_amount: number;
  discount_amount?: number;
  discount_percentage?: number;
  notes?: string;
  sort_order: number;
  is_optional?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

interface QuotationItemCreationAttributes extends Optional<QuotationItemAttributes, 'id' | 'created_at' | 'updated_at' | 'item_code' | 'category' | 'discount_amount' | 'discount_percentage' | 'notes' | 'is_optional'> {}

class QuotationItem extends Model<QuotationItemAttributes, QuotationItemCreationAttributes> implements QuotationItemAttributes {
  public id!: string;
  public quotation_id!: string;
  public item_code?: string;
  public description!: string;
  public category?: string;
  public quantity!: number;
  public unit!: string;
  public unit_price!: number;
  public total_price!: number;
  public sst_rate!: number;
  public sst_amount!: number;
  public discount_amount?: number;
  public discount_percentage?: number;
  public notes?: string;
  public sort_order!: number;
  public is_optional?: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

QuotationItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    quotation_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'quotations',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    item_code: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 0,
      },
    },
    unit: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'unit',
    },
    unit_price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    total_price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    sst_rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 8, // Malaysian SST standard rate
    },
    sst_amount: {
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
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    is_optional: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'QuotationItem',
    tableName: 'quotation_items',
    timestamps: true,
    underscored: true,
  }
);

export default QuotationItem;