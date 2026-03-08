variable "project_name" {
  description = "Project name"
  type        = string
}

variable "env" {
  description = "Environment (dev/prod)"
  type        = string
}

# ---------- Networking ----------

variable "private_subnet_ids" {
  description = "Private subnet IDs for ECS services"
  type        = list(string)
}

variable "ecs_security_group_ids" {
  description = "Security group IDs for ECS tasks"
  type        = list(string)
}

# ---------- IAM ----------

variable "task_execution_role_arn" {
  description = "ARN of the ECS task execution role (image pull, logs)"
  type        = string
}

variable "task_role_arn" {
  description = "ARN of the ECS task role (application permissions)"
  type        = string
}

# ---------- API Task Definition ----------

variable "api_image" {
  description = "Docker image URI for the API service"
  type        = string
  default     = "placeholder:latest"
}

variable "api_container_port" {
  description = "Container port the API listens on"
  type        = number
  default     = 3000
}

variable "api_task_cpu" {
  description = "CPU units for the API task (1 vCPU = 1024)"
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

variable "api_environment" {
  description = "Environment variables for the API container"
  type = list(object({
    name  = string
    value = string
  }))
  default = []
}

# ---------- Worker Task Definition ----------

variable "worker_image" {
  description = "Docker image URI for the Worker service"
  type        = string
  default     = "placeholder:latest"
}

variable "worker_task_cpu" {
  description = "CPU units for the Worker task (1 vCPU = 1024)"
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

variable "worker_environment" {
  description = "Environment variables for the Worker container"
  type = list(object({
    name  = string
    value = string
  }))
  default = []
}

# ---------- ALB integration (API only) ----------

variable "api_target_group_arn" {
  description = "ARN of the ALB target group for the API service"
  type        = string
}

# ---------- Autoscaling ----------

variable "api_autoscaling_min" {
  description = "Minimum number of API tasks"
  type        = number
  default     = 1
}

variable "api_autoscaling_max" {
  description = "Maximum number of API tasks"
  type        = number
  default     = 4
}

variable "api_cpu_target_value" {
  description = "Target CPU utilization (%) for API autoscaling"
  type        = number
  default     = 60
}

variable "worker_autoscaling_min" {
  description = "Minimum number of Worker tasks"
  type        = number
  default     = 1
}

variable "worker_autoscaling_max" {
  description = "Maximum number of Worker tasks"
  type        = number
  default     = 4
}

variable "worker_cpu_target_value" {
  description = "Target CPU utilization (%) for Worker autoscaling"
  type        = number
  default     = 60
}
