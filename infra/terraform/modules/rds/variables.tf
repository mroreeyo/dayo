variable "project_name" {
  description = "Project name"
  type        = string
}

variable "env" {
  description = "Environment (dev/prod)"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for DB subnet group"
  type        = list(string)
}

variable "vpc_security_group_ids" {
  description = "Security group IDs to attach to the RDS instance"
  type        = list(string)
}

variable "instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.micro"
}

variable "allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
  default     = 20
}

variable "max_allocated_storage" {
  description = "Max allocated storage in GB for autoscaling (0 = disabled)"
  type        = number
  default     = 100
}

variable "engine_version" {
  description = "Postgres engine version"
  type        = string
  default     = "16"
}

variable "db_name" {
  description = "Initial database name"
  type        = string
  default     = "shared_calendar"
}

variable "db_username" {
  description = "Master username"
  type        = string
  default     = "postgres"
}

variable "multi_az" {
  description = "Enable Multi-AZ deployment"
  type        = bool
  default     = false
}

variable "backup_retention_period" {
  description = "Number of days to retain automated backups"
  type        = number
  default     = 7
}

variable "deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = false
}

variable "skip_final_snapshot" {
  description = "Skip final snapshot on deletion"
  type        = bool
  default     = true
}

variable "performance_insights_enabled" {
  description = "Enable Performance Insights"
  type        = bool
  default     = false
}
