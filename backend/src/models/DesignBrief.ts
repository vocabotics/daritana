import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/connection';

interface DesignBriefAttributes {
  id: string;
  project_id: string;
  client_id: string;
  brief_name: string;
  project_type: string;
  requirements: string;
  budget: number;
  target_completion_date?: Date;
  pinterest_board?: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'revision_needed' | 'rejected';
  
  // Location details
  project_location: {
    address: string;
    city: string;
    state: string;
    postcode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  
  // Cultural preferences
  cultural_preferences?: {
    primary_culture: string;
    secondary_influences?: string[];
    religious_considerations?: string;
    feng_shui_required?: boolean;
    vastu_compliance?: boolean;
    color_preferences?: string[];
    avoid_colors?: string[];
    cultural_symbols?: string[];
  };
  
  // Climate considerations
  climate_features?: {
    ventilation_strategy: string;
    sun_shading_required: boolean;
    rain_protection: string;
    humidity_control: string;
    thermal_comfort: string;
    natural_lighting: boolean;
    outdoor_integration: boolean;
  };
  
  // Room specifications
  rooms_requirements: Array<{
    room_type: string;
    dimensions?: string;
    special_requirements?: string;
    cultural_function?: string;
    priority_level: 'high' | 'medium' | 'low';
  }>;
  
  // Material preferences
  material_preferences?: {
    preferred_materials: string[];
    avoid_materials: string[];
    sustainability_priority: 'high' | 'medium' | 'low';
    local_materials_preferred: boolean;
    budget_allocation?: {
      flooring: number;
      walls: number;
      ceiling: number;
      furniture: number;
      lighting: number;
      accessories: number;
    };
  };
  
  // Timeline preferences
  timeline_preferences?: {
    flexible_dates: boolean;
    rush_job: boolean;
    seasonal_considerations?: string;
    milestone_priorities?: string[];
  };
  
  // Generated outputs (filled by system)
  estimated_timeline?: number; // in days
  generated_tasks?: Array<{
    task_name: string;
    estimated_duration: number;
    dependencies: string[];
    assigned_role: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  
  resource_allocation?: {
    required_roles: string[];
    estimated_hours_per_role: Record<string, number>;
    material_quantities?: Record<string, number>;
  };
  
  // Approval workflow
  submitted_by?: string;
  reviewed_by?: string;
  approved_by?: string;
  submitted_at?: Date;
  reviewed_at?: Date;
  approved_at?: Date;
  rejection_reason?: string;
  revision_notes?: string;
  
  created_at?: Date;
  updated_at?: Date;
}

interface DesignBriefCreationAttributes extends Optional<DesignBriefAttributes, 'id' | 'created_at' | 'updated_at' | 'target_completion_date' | 'pinterest_board' | 'cultural_preferences' | 'climate_features' | 'material_preferences' | 'timeline_preferences' | 'estimated_timeline' | 'generated_tasks' | 'resource_allocation' | 'submitted_by' | 'reviewed_by' | 'approved_by' | 'submitted_at' | 'reviewed_at' | 'approved_at' | 'rejection_reason' | 'revision_notes'> {}

class DesignBrief extends Model<DesignBriefAttributes, DesignBriefCreationAttributes> implements DesignBriefAttributes {
  public id!: string;
  public project_id!: string;
  public client_id!: string;
  public brief_name!: string;
  public project_type!: string;
  public requirements!: string;
  public budget!: number;
  public target_completion_date?: Date;
  public pinterest_board?: string;
  public status!: 'draft' | 'submitted' | 'under_review' | 'approved' | 'revision_needed' | 'rejected';
  
  public project_location!: {
    address: string;
    city: string;
    state: string;
    postcode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  
  public cultural_preferences?: {
    primary_culture: string;
    secondary_influences?: string[];
    religious_considerations?: string;
    feng_shui_required?: boolean;
    vastu_compliance?: boolean;
    color_preferences?: string[];
    avoid_colors?: string[];
    cultural_symbols?: string[];
  };
  
  public climate_features?: {
    ventilation_strategy: string;
    sun_shading_required: boolean;
    rain_protection: string;
    humidity_control: string;
    thermal_comfort: string;
    natural_lighting: boolean;
    outdoor_integration: boolean;
  };
  
  public rooms_requirements!: Array<{
    room_type: string;
    dimensions?: string;
    special_requirements?: string;
    cultural_function?: string;
    priority_level: 'high' | 'medium' | 'low';
  }>;
  
  public material_preferences?: {
    preferred_materials: string[];
    avoid_materials: string[];
    sustainability_priority: 'high' | 'medium' | 'low';
    local_materials_preferred: boolean;
    budget_allocation?: {
      flooring: number;
      walls: number;
      ceiling: number;
      furniture: number;
      lighting: number;
      accessories: number;
    };
  };
  
  public timeline_preferences?: {
    flexible_dates: boolean;
    rush_job: boolean;
    seasonal_considerations?: string;
    milestone_priorities?: string[];
  };
  
  public estimated_timeline?: number;
  public generated_tasks?: Array<{
    task_name: string;
    estimated_duration: number;
    dependencies: string[];
    assigned_role: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  
  public resource_allocation?: {
    required_roles: string[];
    estimated_hours_per_role: Record<string, number>;
    material_quantities?: Record<string, number>;
  };
  
  public submitted_by?: string;
  public reviewed_by?: string;
  public approved_by?: string;
  public submitted_at?: Date;
  public reviewed_at?: Date;
  public approved_at?: Date;
  public rejection_reason?: string;
  public revision_notes?: string;
  
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

DesignBrief.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
    brief_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    project_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    requirements: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    budget: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    target_completion_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    pinterest_board: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('draft', 'submitted', 'under_review', 'approved', 'revision_needed', 'rejected'),
      allowNull: false,
      defaultValue: 'draft',
    },
    project_location: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    cultural_preferences: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    climate_features: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    rooms_requirements: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    material_preferences: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    timeline_preferences: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    estimated_timeline: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    generated_tasks: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    resource_allocation: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    submitted_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    reviewed_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    approved_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    submitted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reviewed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    revision_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'DesignBrief',
    tableName: 'design_briefs',
    timestamps: true,
    underscored: true,
  }
);

export default DesignBrief;