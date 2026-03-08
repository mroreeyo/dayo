variable "project_name" {
  description = "Project name"
  type        = string
}

variable "env" {
  description = "Environment (dev/prod)"
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
}

variable "domain_name" {
  description = "Domain name"
  type        = string
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.micro"
}

variable "redis_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t4g.micro"
}

variable "api_image" {
  description = "Docker image URI for the API service"
  type        = string
  default     = "placeholder:latest"
}

variable "worker_image" {
  description = "Docker image URI for the Worker service"
  type        = string
  default     = "placeholder:latest"
}

variable "api_container_port" {
  description = "Container port the API listens on"
  type        = number
  default     = 3000
}

variable "api_task_cpu" {
  description = "CPU units for the API task"
  type        = number
  default     = 256
}

variable "api_task_memory" {
  description = "Memory (MiB) for the API task"
  type        = number
  default     = 512
}

variable "api_desired_count" {
  description = "Desired number of API tasks"
  type        = number
  default     = 1
}

variable "worker_task_cpu" {
  description = "CPU units for the Worker task"
  type        = number
  default     = 256
}

variable "worker_task_memory" {
  description = "Memory (MiB) for the Worker task"
  type        = number
  default     = 512
}

variable "worker_desired_count" {
  description = "Desired number of Worker tasks"
  type        = number
  default     = 1
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS (empty to skip)"
  type        = string
  default     = ""
}
