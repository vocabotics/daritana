import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/connection';

interface ItemLibraryAttributes {
  id: string;
  item_code: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  unit: string;
  base_price: number;
  sst_rate: number;
  supplier?: string;
  brand?: string;
  specifications?: string;
  is_active: boolean;
  tags?: string[];
  image_url?: string;
  created_by: string;
  created_at?: Date;
  updated_at?: Date;
}

interface ItemLibraryCreationAttributes extends Optional<ItemLibraryAttributes, 'id' | 'created_at' | 'updated_at' | 'subcategory' | 'supplier' | 'brand' | 'specifications' | 'tags' | 'image_url'> {}

class ItemLibrary extends Model<ItemLibraryAttributes, ItemLibraryCreationAttributes> implements ItemLibraryAttributes {
  public id!: string;
  public item_code!: string;
  public name!: string;
  public description!: string;
  public category!: string;
  public subcategory?: string;
  public unit!: string;
  public base_price!: number;
  public sst_rate!: number;
  public supplier?: string;
  public brand?: string;
  public specifications?: string;
  public is_active!: boolean;
  public tags?: string[];
  public image_url?: string;
  public created_by!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

ItemLibrary.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    item_code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    subcategory: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    unit: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'unit',
    },
    base_price: {
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
    supplier: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    brand: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    specifications: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
    },
    image_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'ItemLibrary',
    tableName: 'item_library',
    timestamps: true,
    underscored: true,
  }
);

export default ItemLibrary;