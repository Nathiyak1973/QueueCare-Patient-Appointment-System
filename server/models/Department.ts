import mongoose, { Schema, Document } from 'mongoose';

export interface IDepartmentDocument extends Document {
  name: string;
  code: string;
  description: string;
  icon: string;
  headOfDepartment?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartmentDocument>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, required: true },
    icon: { type: String, default: 'Activity' },
    headOfDepartment: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

DepartmentSchema.index({ code: 1 });

export const DepartmentModel =
  mongoose.models.Department || mongoose.model<IDepartmentDocument>('Department', DepartmentSchema);
