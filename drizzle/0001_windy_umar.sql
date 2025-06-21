CREATE TABLE "activity_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"operation" text NOT NULL,
	"item_type" text NOT NULL,
	"item_id" text NOT NULL,
	"item_name" text NOT NULL,
	"status" text NOT NULL,
	"error_message" text,
	"metadata" jsonb,
	"batch_id" text,
	"processed_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bulk_operations" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_id" text NOT NULL,
	"user_id" text NOT NULL,
	"operation" text NOT NULL,
	"total_items" integer NOT NULL,
	"success_count" integer DEFAULT 0,
	"failed_count" integer DEFAULT 0,
	"skipped_count" integer DEFAULT 0,
	"is_completed" boolean DEFAULT false,
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "bulk_operations_batch_id_unique" UNIQUE("batch_id")
);
