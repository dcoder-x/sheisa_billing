export type FieldType = "text" | "image" | "date" | "table"
export type UnitType = "percent" | "px"

export interface TableColumn {
  id: string
  header: string
  key: string // JSON key in the data source
  width: number // Percentage of table width
}

export interface DataField {
  id: string
  type: FieldType
  x: number // Percentage of canvas width (0-100) or pixels
  y: number // Percentage of canvas height (0-100) or pixels
  width: number // Percentage of canvas width or pixels
  height: number // Percentage of canvas height or pixels
  unit?: UnitType // Defaults to percent for backward compatibility
  page?: number // Page number for multi-page documents (1-indexed)
  label: string
  placeholder?: string
  required?: boolean
  fontSize?: number
  fontFamily?: string
  fontWeight?: string
  textAlign?: "left" | "center" | "right"
  textColor?: string
  backgroundColor?: string
  borderColor?: string
  borderRadius?: number // Unified border radius
  borderRadiusTopLeft?: number // Individual corner radii
  borderRadiusTopRight?: number
  borderRadiusBottomRight?: number
  borderRadiusBottomLeft?: number
  borderWidth?: number
  checked?: boolean // For checkbox
  multiline?: boolean // For text fields
  rotation?: number // Rotation angle in degrees

  // Table specific properties
  columns?: TableColumn[]
  rowHeight?: number
  headerBackgroundColor?: string
  headerTextColor?: string
  alternateRowColor?: string
  showTableHeader?: boolean
  tableHeaderFontSize?: number
  tableBodyFontSize?: number
  tableFontFamily?: string
}

export interface TemplateData {
  id: string
  name: string
  type: "image" | "pdf"
  sourceUrl: string
  sourceWidth: number // Original dimensions
  sourceHeight: number
  fields: DataField[]
  createdAt: Date
  updatedAt: Date
}

export interface CanvasDimensions {
  width: number
  height: number
  scale: number
}
