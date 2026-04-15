CREATE TABLE "todo_attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"todo_id" integer,
	"type" text NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "todo_attachments" ADD CONSTRAINT "todo_attachments_todo_id_todos_id_fk" FOREIGN KEY ("todo_id") REFERENCES "public"."todos"("id") ON DELETE cascade ON UPDATE no action;