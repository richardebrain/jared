CREATE TABLE "achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"icon" text NOT NULL,
	"category" text NOT NULL,
	"required_points" integer,
	"required_modules" integer,
	"level" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "assessment_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_id" integer,
	"question_count" integer DEFAULT 40,
	"time_per_question" integer DEFAULT 60,
	"starting_difficulty" integer DEFAULT 3,
	"min_domain_coverage" integer DEFAULT 1,
	"updated_by" integer,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "assessment_domains" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"question_weight" integer NOT NULL,
	"display_order" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "assessment_domains_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "assessment_questions" (
	"id" text PRIMARY KEY NOT NULL,
	"domain_id" integer NOT NULL,
	"text" text NOT NULL,
	"options" text NOT NULL,
	"correct_answer" integer NOT NULL,
	"difficulty" text NOT NULL,
	"explanation" text,
	"mini_lesson" text,
	"tags" text,
	"created_by" integer,
	"approved_by" integer,
	"is_approved" boolean DEFAULT false,
	"is_enabled" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "assessment_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"assessment_id" integer NOT NULL,
	"question_id" text NOT NULL,
	"user_id" integer NOT NULL,
	"question_sequence" integer NOT NULL,
	"selected_answer" integer,
	"is_correct" boolean NOT NULL,
	"points_earned" integer DEFAULT 0,
	"time_spent" integer,
	"timed_out" boolean DEFAULT false,
	"domain_id" integer NOT NULL,
	"difficulty" text NOT NULL,
	"answered_at" timestamp,
	"was_late_submission" boolean DEFAULT false,
	"processing_timestamp" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "assessment_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"assessment_id" integer NOT NULL,
	"overall_score" integer NOT NULL,
	"total_questions" integer NOT NULL,
	"total_correct" integer NOT NULL,
	"accuracy_rate" double precision NOT NULL,
	"total_time_seconds" integer,
	"primary_mini_lessons" json NOT NULL,
	"estimated_improvement_time" integer,
	"domain_breakdown" json NOT NULL,
	"strength_areas" json NOT NULL,
	"growth_areas" json NOT NULL,
	"personalized_summary" text,
	"immediate_next_steps" json,
	"calculated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "assessment_retake_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"requested_by" integer NOT NULL,
	"approved_by" integer,
	"school_id" integer NOT NULL,
	"request_reason" text NOT NULL,
	"admin_notes" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"requested_at" timestamp DEFAULT now(),
	"responded_at" timestamp,
	"expires_at" timestamp,
	"used" boolean DEFAULT false,
	"used_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" text DEFAULT 'initial',
	"overall_score" integer,
	"completed" boolean DEFAULT false,
	"results" json,
	"domain_scores" json,
	"current_difficulty" integer DEFAULT 3,
	"difficulty_progression" json,
	"domain_coverage" json,
	"category_scores" json,
	"strength_areas" json,
	"growth_areas" json,
	"incorrect_answers" json,
	"recommended_modules" json,
	"personalized_learning_path" json,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"assessment_type" text DEFAULT 'INITIAL_ADAPTIVE',
	"notes" text,
	"teacher_level" text
);
--> statement-breakpoint
CREATE TABLE "avatar_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"display_order" integer DEFAULT 0,
	"is_layerable" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "avatar_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "avatar_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"category_id" integer NOT NULL,
	"svg_path" text NOT NULL,
	"points_cost" integer DEFAULT 50 NOT NULL,
	"level_required" integer DEFAULT 1,
	"rarity" text DEFAULT 'common',
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bear_bucks_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipient_id" integer NOT NULL,
	"sender_id" integer,
	"amount" integer NOT NULL,
	"reason" text NOT NULL,
	"category" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bonus_boxes" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipient_id" integer NOT NULL,
	"sender_id" integer NOT NULL,
	"box_type" text NOT NULL,
	"points_awarded" integer NOT NULL,
	"message" text,
	"is_opened" boolean DEFAULT false,
	"opened_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "child_age_progression" (
	"id" serial PRIMARY KEY NOT NULL,
	"child_id" integer NOT NULL,
	"previous_age_group" text NOT NULL,
	"new_age_group" text NOT NULL,
	"progression_date" date NOT NULL,
	"milestones_completed" integer DEFAULT 0,
	"total_milestones" integer DEFAULT 0,
	"completion_percentage" double precision DEFAULT 0,
	"notes" text,
	"recorded_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "children" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_id" integer NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"birth_date" date,
	"parent_guardian_name" text,
	"parent_email" text,
	"reference_photo_url" text,
	"facial_features" json,
	"is_active" boolean DEFAULT true,
	"shared_with_school" boolean DEFAULT false,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "comment_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"comment_id" integer NOT NULL,
	"vote_type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_module_awards" (
	"id" serial PRIMARY KEY NOT NULL,
	"module_id" integer NOT NULL,
	"school_id" integer NOT NULL,
	"award_date" timestamp DEFAULT now(),
	"prize_points" integer NOT NULL,
	"rank" integer NOT NULL,
	"month_year" text NOT NULL,
	"average_rating" integer NOT NULL,
	"total_ratings" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "community_modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"module_id" integer NOT NULL,
	"shared_by_school_id" integer NOT NULL,
	"shared_date" timestamp DEFAULT now(),
	"status" text DEFAULT 'active' NOT NULL,
	"total_completions" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "core_values_shout_outs" (
	"id" serial PRIMARY KEY NOT NULL,
	"nominator_id" integer NOT NULL,
	"nominee_id" integer NOT NULL,
	"core_value" text NOT NULL,
	"description" text NOT NULL,
	"points_awarded" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "daily_logins" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"login_date" date NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "discussion_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"content" text NOT NULL,
	"author_id" integer NOT NULL,
	"thread_id" integer NOT NULL,
	"parent_comment_id" integer,
	"endorsed" boolean DEFAULT false,
	"upvotes" integer DEFAULT 0,
	"downvotes" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "discussion_threads" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"author_id" integer NOT NULL,
	"category" text NOT NULL,
	"tags" text[] NOT NULL,
	"pinned" boolean DEFAULT false,
	"view_count" integer DEFAULT 0,
	"last_activity_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "early_learning_standards" (
	"id" serial PRIMARY KEY NOT NULL,
	"standard_area" text NOT NULL,
	"strand" text NOT NULL,
	"standard_code" text NOT NULL,
	"age_group" text NOT NULL,
	"standard_text" text NOT NULL,
	"description" text,
	"keywords" text[],
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "early_learning_standards_standard_code_unique" UNIQUE("standard_code")
);
--> statement-breakpoint
CREATE TABLE "ece_hours" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"module_id" integer,
	"category" text NOT NULL,
	"duration" integer NOT NULL,
	"completed_at" timestamp DEFAULT now(),
	"training_title" text NOT NULL,
	"approved_by" integer,
	"school_id" integer,
	"certificate_generated" boolean DEFAULT false,
	"notes" text,
	"training_type" text DEFAULT 'online' NOT NULL,
	"training_location" text,
	"is_manual_entry" boolean DEFAULT false,
	"added_by" integer
);
--> statement-breakpoint
CREATE TABLE "ece_reporting_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_id" integer NOT NULL,
	"reporting_emails" json NOT NULL,
	"frequency" text DEFAULT 'monthly' NOT NULL,
	"is_active" boolean DEFAULT true,
	"last_report_sent" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "edu_tok_snippets" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"video_url" text NOT NULL,
	"thumbnail_url" text,
	"source_url" text,
	"license" text,
	"view_count" integer DEFAULT 0,
	"likes" integer DEFAULT 0,
	"category" text,
	"tags" json,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "edu_tok_user_interactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"snippet_id" integer NOT NULL,
	"liked" boolean DEFAULT false,
	"viewed" boolean DEFAULT false,
	"shared" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "educational_games" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"type" text NOT NULL,
	"difficulty" text NOT NULL,
	"category" text NOT NULL,
	"points_value" integer NOT NULL,
	"config" json,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "game_completions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"game_id" integer NOT NULL,
	"score" integer,
	"time_taken" integer,
	"points_earned" integer NOT NULL,
	"completed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "learning_modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"duration" integer NOT NULL,
	"point_value" integer DEFAULT 5,
	"image_url" text,
	"featured" boolean DEFAULT false,
	"difficulty" text NOT NULL,
	"category" text NOT NULL,
	"content" text,
	"quiz" json,
	"is_visible" boolean DEFAULT true,
	"average_rating" integer DEFAULT 0,
	"rating_count" integer DEFAULT 0,
	"is_shared_to_community" boolean DEFAULT false,
	"school_id" integer,
	"creator_id" integer,
	"module_type" text DEFAULT 'single',
	"course_structure" json,
	"interactive_elements" json,
	"advanced_quiz_types" json,
	"certification_system" json,
	"ece_hours_eligible" boolean DEFAULT false,
	"ece_hours" integer,
	"ece_category" text,
	"training_duration" integer,
	"approved_trainer_id" integer,
	"is_onboarding_module" boolean DEFAULT false,
	"onboarding_order" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "learning_paths" (
	"id" serial PRIMARY KEY NOT NULL,
	"assessment_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"domain_groups" json NOT NULL,
	"total_failed_questions" integer NOT NULL,
	"total_domains" integer NOT NULL,
	"estimated_completion_time" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "learning_standards" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"age_group" text NOT NULL,
	"domain" text,
	"is_active" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "learning_standards_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "lesson_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_by" integer NOT NULL,
	"school_id" integer,
	"title" text NOT NULL,
	"description" text,
	"age_group" text NOT NULL,
	"duration" integer,
	"objectives" text[],
	"materials" text[],
	"activities" json,
	"assessment" text,
	"notes" text,
	"standards_referenced" integer[],
	"is_public" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "meetings" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"host_id" integer NOT NULL,
	"guest_id" integer,
	"time_zone" text NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"meeting_link" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "milestone_tracking" (
	"id" serial PRIMARY KEY NOT NULL,
	"child_id" integer NOT NULL,
	"milestone_id" text NOT NULL,
	"milestone_title" text NOT NULL,
	"category" text NOT NULL,
	"age_group" text NOT NULL,
	"is_achieved" boolean DEFAULT false,
	"achieved_date" date,
	"witnessed_by" text,
	"is_ai_detected" boolean DEFAULT false,
	"notes" text,
	"portfolio_entry_id" integer,
	"recorded_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "module_drafts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"module_data" json NOT NULL,
	"creation_method" text,
	"ai_workflow_step" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "module_ratings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"module_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "naeyc_standards" (
	"id" serial PRIMARY KEY NOT NULL,
	"standard_code" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text,
	"subcategory" text,
	"keywords" text[],
	"age_group" text,
	"is_active" boolean DEFAULT true,
	CONSTRAINT "naeyc_standards_standard_code_unique" UNIQUE("standard_code")
);
--> statement-breakpoint
CREATE TABLE "newsletter_deliveries" (
	"id" serial PRIMARY KEY NOT NULL,
	"newsletter_id" integer NOT NULL,
	"recipient_id" integer NOT NULL,
	"delivery_method" text NOT NULL,
	"sent_at" timestamp DEFAULT now(),
	"opened_at" timestamp,
	"is_read" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "newsletters" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_id" integer NOT NULL,
	"created_by" integer NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"content" json NOT NULL,
	"featured_image" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"scheduled_for" timestamp,
	"published_at" timestamp,
	"recipient_groups" text DEFAULT 'all' NOT NULL,
	"read_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "portfolio_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"child_id" integer NOT NULL,
	"teacher_id" integer NOT NULL,
	"school_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"entry_date" date NOT NULL,
	"entry_type" text DEFAULT 'photograph' NOT NULL,
	"photo_url" text,
	"video_url" text,
	"audio_url" text,
	"work_sample_type" text,
	"work_sample_description" text,
	"observation_notes" text,
	"teacher_observation" text,
	"behavior_observation" text,
	"social_interaction" text,
	"developmental_domain" text[],
	"conversation_transcript" text,
	"conversation_context" text,
	"milestone_achieved" text,
	"skills_demonstrated" text[],
	"family_input" text,
	"family_feedback" text,
	"learning_standards" text[],
	"naeyc_standards" text[],
	"head_start_standards" text[],
	"state_standards" text[],
	"event_type" text,
	"event_description" text,
	"activity_type" text,
	"recognized_objects" text[],
	"ai_summary" text,
	"ai_analysis_data" json,
	"tags" text[],
	"is_approved" boolean DEFAULT false,
	"processing_status" text DEFAULT 'pending',
	"access_level" text DEFAULT 'teacher',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "question_availability" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_id" text NOT NULL,
	"school_id" integer,
	"is_enabled" boolean DEFAULT true,
	"enabled_by" integer,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "schools" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"city" text,
	"state" text,
	"zip_code" text,
	"contact_email" text,
	"contact_phone" text,
	"logo_url" text,
	"website_url" text,
	"subscription_active" boolean DEFAULT false,
	"subscription_type" text DEFAULT 'basic',
	"subscription_expires_at" timestamp,
	"teacher_count" integer DEFAULT 0,
	"is_free_access" boolean DEFAULT false,
	"admin_password_hash" text,
	"customization" json,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "schools_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" json NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "songs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"prompt" text NOT NULL,
	"audio_url" text NOT NULL,
	"task_id" text,
	"status" text DEFAULT 'completed' NOT NULL,
	"generated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "spin_game_rewards" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"reward_type" text NOT NULL,
	"reward_amount" integer,
	"item_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "store_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"icon" text NOT NULL,
	"category" text NOT NULL,
	"bear_bucks_cost" integer NOT NULL,
	"level_required" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "streak_rewards" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"reward_type" text NOT NULL,
	"streak_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "teacher_invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_id" integer NOT NULL,
	"email" text NOT NULL,
	"invitation_token" text NOT NULL,
	"invited_by_user_id" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"sent_at" timestamp DEFAULT now(),
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"invite_email_sent" boolean DEFAULT false,
	CONSTRAINT "teacher_invitations_invitation_token_unique" UNIQUE("invitation_token")
);
--> statement-breakpoint
CREATE TABLE "teacher_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" integer NOT NULL,
	"recipient_id" integer NOT NULL,
	"school_id" integer,
	"message_type" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"important" boolean DEFAULT false,
	"expires_at" timestamp,
	"related_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "teacher_self_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"results" json NOT NULL,
	"strength_areas" text[],
	"growth_areas" text[],
	"average_skill_level" double precision,
	"teacher_level" text
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"achievement_id" integer NOT NULL,
	"earned_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_avatar_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"item_id" integer NOT NULL,
	"purchased_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_avatars" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT false,
	"components" json NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"item_id" integer NOT NULL,
	"acquired" timestamp DEFAULT now(),
	"used" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"module_id" integer NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"completed" boolean DEFAULT false,
	"passed" boolean DEFAULT false,
	"final_score" integer,
	"recommended" boolean DEFAULT false,
	"points_earned" integer DEFAULT 0,
	"last_accessed" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_id" integer,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"language" text NOT NULL,
	"native_language" text NOT NULL,
	"time_zone" text NOT NULL,
	"profile_picture" text,
	"active_avatar_id" integer,
	"learning_style" json,
	"bear_bucks" integer DEFAULT 0,
	"points" integer DEFAULT 0,
	"lifetime_points" integer DEFAULT 0,
	"level" integer DEFAULT 1,
	"streak" integer DEFAULT 0,
	"last_active" timestamp,
	"achievement_count" integer DEFAULT 0,
	"is_admin" boolean DEFAULT false,
	"is_school_admin" boolean DEFAULT false,
	"is_owner" boolean DEFAULT false,
	"fingerprint_expiration" date,
	"cpr_expiration" date,
	"first_aid_expiration" date,
	"food_handler_expiration" date,
	"job_title" text,
	"designations" json,
	"has_unread_messages" boolean DEFAULT false,
	"google_id" text,
	"ece_hours_renewal_date" date,
	"song_requests_this_week" integer DEFAULT 0,
	"last_song_week" text,
	"has_completed_tutorial" boolean DEFAULT false,
	"reset_token" text,
	"reset_token_expires" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
CREATE TABLE "video_quiz_completions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"video_id" text NOT NULL,
	"points_earned" integer NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_ratings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"video_id" text NOT NULL,
	"rating" integer NOT NULL,
	"review" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "voice_narration_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"usage_date" date NOT NULL,
	"week_start" date NOT NULL,
	"usage_count" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "assessment_config" ADD CONSTRAINT "assessment_config_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_config" ADD CONSTRAINT "assessment_config_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_domain_id_assessment_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."assessment_domains"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_responses" ADD CONSTRAINT "assessment_responses_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_responses" ADD CONSTRAINT "assessment_responses_question_id_assessment_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."assessment_questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_responses" ADD CONSTRAINT "assessment_responses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_responses" ADD CONSTRAINT "assessment_responses_domain_id_assessment_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."assessment_domains"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_results" ADD CONSTRAINT "assessment_results_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_retake_permissions" ADD CONSTRAINT "assessment_retake_permissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_retake_permissions" ADD CONSTRAINT "assessment_retake_permissions_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_retake_permissions" ADD CONSTRAINT "assessment_retake_permissions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_retake_permissions" ADD CONSTRAINT "assessment_retake_permissions_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "avatar_items" ADD CONSTRAINT "avatar_items_category_id_avatar_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."avatar_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bear_bucks_transactions" ADD CONSTRAINT "bear_bucks_transactions_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bear_bucks_transactions" ADD CONSTRAINT "bear_bucks_transactions_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonus_boxes" ADD CONSTRAINT "bonus_boxes_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonus_boxes" ADD CONSTRAINT "bonus_boxes_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "child_age_progression" ADD CONSTRAINT "child_age_progression_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "child_age_progression" ADD CONSTRAINT "child_age_progression_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "children" ADD CONSTRAINT "children_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "children" ADD CONSTRAINT "children_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_votes" ADD CONSTRAINT "comment_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_votes" ADD CONSTRAINT "comment_votes_comment_id_discussion_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."discussion_comments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_module_awards" ADD CONSTRAINT "community_module_awards_module_id_learning_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."learning_modules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_module_awards" ADD CONSTRAINT "community_module_awards_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_modules" ADD CONSTRAINT "community_modules_module_id_learning_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."learning_modules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_modules" ADD CONSTRAINT "community_modules_shared_by_school_id_schools_id_fk" FOREIGN KEY ("shared_by_school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_values_shout_outs" ADD CONSTRAINT "core_values_shout_outs_nominator_id_users_id_fk" FOREIGN KEY ("nominator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_values_shout_outs" ADD CONSTRAINT "core_values_shout_outs_nominee_id_users_id_fk" FOREIGN KEY ("nominee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_logins" ADD CONSTRAINT "daily_logins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussion_comments" ADD CONSTRAINT "discussion_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussion_comments" ADD CONSTRAINT "discussion_comments_thread_id_discussion_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."discussion_threads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussion_comments" ADD CONSTRAINT "discussion_comments_parent_comment_id_discussion_comments_id_fk" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."discussion_comments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussion_threads" ADD CONSTRAINT "discussion_threads_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ece_hours" ADD CONSTRAINT "ece_hours_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ece_hours" ADD CONSTRAINT "ece_hours_module_id_learning_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."learning_modules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ece_hours" ADD CONSTRAINT "ece_hours_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ece_hours" ADD CONSTRAINT "ece_hours_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ece_hours" ADD CONSTRAINT "ece_hours_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ece_reporting_settings" ADD CONSTRAINT "ece_reporting_settings_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edu_tok_user_interactions" ADD CONSTRAINT "edu_tok_user_interactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edu_tok_user_interactions" ADD CONSTRAINT "edu_tok_user_interactions_snippet_id_edu_tok_snippets_id_fk" FOREIGN KEY ("snippet_id") REFERENCES "public"."edu_tok_snippets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_completions" ADD CONSTRAINT "game_completions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_completions" ADD CONSTRAINT "game_completions_game_id_educational_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."educational_games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_modules" ADD CONSTRAINT "learning_modules_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_modules" ADD CONSTRAINT "learning_modules_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_modules" ADD CONSTRAINT "learning_modules_approved_trainer_id_users_id_fk" FOREIGN KEY ("approved_trainer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_paths" ADD CONSTRAINT "learning_paths_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_paths" ADD CONSTRAINT "learning_paths_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_plans" ADD CONSTRAINT "lesson_plans_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_plans" ADD CONSTRAINT "lesson_plans_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_host_id_users_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_guest_id_users_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestone_tracking" ADD CONSTRAINT "milestone_tracking_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestone_tracking" ADD CONSTRAINT "milestone_tracking_portfolio_entry_id_portfolio_entries_id_fk" FOREIGN KEY ("portfolio_entry_id") REFERENCES "public"."portfolio_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestone_tracking" ADD CONSTRAINT "milestone_tracking_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_drafts" ADD CONSTRAINT "module_drafts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_ratings" ADD CONSTRAINT "module_ratings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_ratings" ADD CONSTRAINT "module_ratings_module_id_learning_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."learning_modules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_deliveries" ADD CONSTRAINT "newsletter_deliveries_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletters" ADD CONSTRAINT "newsletters_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletters" ADD CONSTRAINT "newsletters_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_entries" ADD CONSTRAINT "portfolio_entries_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_entries" ADD CONSTRAINT "portfolio_entries_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_entries" ADD CONSTRAINT "portfolio_entries_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_availability" ADD CONSTRAINT "question_availability_question_id_assessment_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."assessment_questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_availability" ADD CONSTRAINT "question_availability_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_availability" ADD CONSTRAINT "question_availability_enabled_by_users_id_fk" FOREIGN KEY ("enabled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "songs" ADD CONSTRAINT "songs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spin_game_rewards" ADD CONSTRAINT "spin_game_rewards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spin_game_rewards" ADD CONSTRAINT "spin_game_rewards_item_id_store_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."store_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streak_rewards" ADD CONSTRAINT "streak_rewards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_invitations" ADD CONSTRAINT "teacher_invitations_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_invitations" ADD CONSTRAINT "teacher_invitations_invited_by_user_id_users_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_messages" ADD CONSTRAINT "teacher_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_messages" ADD CONSTRAINT "teacher_messages_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_messages" ADD CONSTRAINT "teacher_messages_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_self_assessments" ADD CONSTRAINT "teacher_self_assessments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_avatar_items" ADD CONSTRAINT "user_avatar_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_avatar_items" ADD CONSTRAINT "user_avatar_items_item_id_avatar_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."avatar_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_avatars" ADD CONSTRAINT "user_avatars_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_items" ADD CONSTRAINT "user_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_items" ADD CONSTRAINT "user_items_item_id_store_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."store_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_module_id_learning_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."learning_modules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_quiz_completions" ADD CONSTRAINT "video_quiz_completions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_ratings" ADD CONSTRAINT "video_ratings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_narration_usage" ADD CONSTRAINT "voice_narration_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assessment_config_school_idx" ON "assessment_config" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "assessment_config_platform_idx" ON "assessment_config" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "assessment_domains_active_idx" ON "assessment_domains" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "assessment_domains_display_order_idx" ON "assessment_domains" USING btree ("display_order");--> statement-breakpoint
CREATE INDEX "assessment_domains_name_idx" ON "assessment_domains" USING btree ("name");--> statement-breakpoint
CREATE INDEX "assessment_questions_domain_difficulty_availability_idx" ON "assessment_questions" USING btree ("domain_id","difficulty","is_approved","is_enabled");--> statement-breakpoint
CREATE INDEX "assessment_questions_user_assessment_domain_idx" ON "assessment_questions" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "assessment_questions_approved_enabled_idx" ON "assessment_questions" USING btree ("is_approved","is_enabled");--> statement-breakpoint
CREATE INDEX "assessment_questions_difficulty_idx" ON "assessment_questions" USING btree ("difficulty");--> statement-breakpoint
CREATE INDEX "assessment_questions_domain_idx" ON "assessment_questions" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "assessment_questions_enabled_idx" ON "assessment_questions" USING btree ("is_enabled");--> statement-breakpoint
CREATE INDEX "assessment_questions_approval_status_idx" ON "assessment_questions" USING btree ("is_approved");--> statement-breakpoint
CREATE INDEX "assessment_questions_created_by_idx" ON "assessment_questions" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "assessment_responses_user_assessment_domain_idx" ON "assessment_responses" USING btree ("user_id","assessment_id","domain_id");--> statement-breakpoint
CREATE INDEX "assessment_responses_assessment_sequence_idx" ON "assessment_responses" USING btree ("assessment_id","question_sequence");--> statement-breakpoint
CREATE INDEX "assessment_responses_domain_performance_idx" ON "assessment_responses" USING btree ("domain_id","is_correct","difficulty");--> statement-breakpoint
CREATE INDEX "assessment_responses_user_progress_idx" ON "assessment_responses" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "assessment_responses_question_analytics_idx" ON "assessment_responses" USING btree ("question_id","is_correct","time_spent");--> statement-breakpoint
CREATE INDEX "assessment_responses_assessment_completion_idx" ON "assessment_responses" USING btree ("assessment_id","created_at");--> statement-breakpoint
CREATE INDEX "assessment_results_assessment_idx" ON "assessment_results" USING btree ("assessment_id");--> statement-breakpoint
CREATE INDEX "assessment_results_score_idx" ON "assessment_results" USING btree ("overall_score");--> statement-breakpoint
CREATE INDEX "assessment_results_accuracy_idx" ON "assessment_results" USING btree ("accuracy_rate");--> statement-breakpoint
CREATE INDEX "assessment_results_total_time_idx" ON "assessment_results" USING btree ("total_time_seconds");--> statement-breakpoint
CREATE INDEX "assessment_results_unique_assessment_idx" ON "assessment_results" USING btree ("assessment_id");--> statement-breakpoint
CREATE INDEX "assessment_retake_permissions_pending_idx" ON "assessment_retake_permissions" USING btree ("school_id","status");--> statement-breakpoint
CREATE INDEX "assessment_retake_permissions_user_idx" ON "assessment_retake_permissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "assessment_retake_permissions_active_idx" ON "assessment_retake_permissions" USING btree ("user_id","status","expires_at");--> statement-breakpoint
CREATE INDEX "assessments_user_type_completed_idx" ON "assessments" USING btree ("user_id","type","completed");--> statement-breakpoint
CREATE INDEX "assessments_user_completed_idx" ON "assessments" USING btree ("user_id","completed");--> statement-breakpoint
CREATE INDEX "assessments_type_idx" ON "assessments" USING btree ("type");--> statement-breakpoint
CREATE INDEX "assessments_completed_idx" ON "assessments" USING btree ("completed");--> statement-breakpoint
CREATE INDEX "assessments_completed_at_idx" ON "assessments" USING btree ("completed_at");--> statement-breakpoint
CREATE INDEX "assessments_assessment_type_idx" ON "assessments" USING btree ("assessment_type");--> statement-breakpoint
CREATE INDEX "child_age_progression_child_idx" ON "child_age_progression" USING btree ("child_id");--> statement-breakpoint
CREATE INDEX "child_age_progression_age_group_idx" ON "child_age_progression" USING btree ("new_age_group");--> statement-breakpoint
CREATE INDEX "child_age_progression_progression_date_idx" ON "child_age_progression" USING btree ("progression_date");--> statement-breakpoint
CREATE INDEX "child_age_progression_recorded_by_idx" ON "child_age_progression" USING btree ("recorded_by");--> statement-breakpoint
CREATE INDEX "children_school_idx" ON "children" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "children_active_idx" ON "children" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "children_created_by_idx" ON "children" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "standards_area_strand_idx" ON "early_learning_standards" USING btree ("standard_area","strand");--> statement-breakpoint
CREATE INDEX "standards_age_group_idx" ON "early_learning_standards" USING btree ("age_group");--> statement-breakpoint
CREATE INDEX "standards_keywords_idx" ON "early_learning_standards" USING btree ("keywords");--> statement-breakpoint
CREATE INDEX "ece_hours_user_idx" ON "ece_hours" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ece_hours_category_idx" ON "ece_hours" USING btree ("category");--> statement-breakpoint
CREATE INDEX "ece_hours_school_idx" ON "ece_hours" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "ece_hours_completed_date_idx" ON "ece_hours" USING btree ("completed_at");--> statement-breakpoint
CREATE INDEX "ece_hours_training_type_idx" ON "ece_hours" USING btree ("training_type");--> statement-breakpoint
CREATE INDEX "ece_reporting_school_idx" ON "ece_reporting_settings" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "learning_paths_assessment_idx" ON "learning_paths" USING btree ("assessment_id");--> statement-breakpoint
CREATE INDEX "learning_paths_user_idx" ON "learning_paths" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "learning_paths_user_assessment_idx" ON "learning_paths" USING btree ("user_id","assessment_id");--> statement-breakpoint
CREATE INDEX "learning_paths_failed_questions_idx" ON "learning_paths" USING btree ("total_failed_questions");--> statement-breakpoint
CREATE INDEX "learning_paths_unique_assessment_idx" ON "learning_paths" USING btree ("assessment_id");--> statement-breakpoint
CREATE INDEX "learning_standards_category_idx" ON "learning_standards" USING btree ("category");--> statement-breakpoint
CREATE INDEX "learning_standards_age_group_idx" ON "learning_standards" USING btree ("age_group");--> statement-breakpoint
CREATE INDEX "learning_standards_active_idx" ON "learning_standards" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "learning_standards_code_idx" ON "learning_standards" USING btree ("code");--> statement-breakpoint
CREATE INDEX "lesson_plans_created_by_idx" ON "lesson_plans" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "lesson_plans_school_idx" ON "lesson_plans" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "lesson_plans_age_group_idx" ON "lesson_plans" USING btree ("age_group");--> statement-breakpoint
CREATE INDEX "lesson_plans_public_idx" ON "lesson_plans" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "milestone_tracking_child_idx" ON "milestone_tracking" USING btree ("child_id");--> statement-breakpoint
CREATE INDEX "milestone_tracking_category_idx" ON "milestone_tracking" USING btree ("category");--> statement-breakpoint
CREATE INDEX "milestone_tracking_age_group_idx" ON "milestone_tracking" USING btree ("age_group");--> statement-breakpoint
CREATE INDEX "milestone_tracking_achieved_idx" ON "milestone_tracking" USING btree ("is_achieved");--> statement-breakpoint
CREATE INDEX "milestone_tracking_recorded_by_idx" ON "milestone_tracking" USING btree ("recorded_by");--> statement-breakpoint
CREATE INDEX "naeyc_standards_category_idx" ON "naeyc_standards" USING btree ("category");--> statement-breakpoint
CREATE INDEX "naeyc_standards_age_group_idx" ON "naeyc_standards" USING btree ("age_group");--> statement-breakpoint
CREATE INDEX "naeyc_standards_active_idx" ON "naeyc_standards" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "portfolio_entries_child_idx" ON "portfolio_entries" USING btree ("child_id");--> statement-breakpoint
CREATE INDEX "portfolio_entries_teacher_idx" ON "portfolio_entries" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "portfolio_entries_school_idx" ON "portfolio_entries" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "portfolio_entries_date_idx" ON "portfolio_entries" USING btree ("entry_date");--> statement-breakpoint
CREATE INDEX "portfolio_entries_status_idx" ON "portfolio_entries" USING btree ("processing_status");--> statement-breakpoint
CREATE INDEX "question_availability_question_school_enabled_idx" ON "question_availability" USING btree ("question_id","school_id","is_enabled");--> statement-breakpoint
CREATE INDEX "question_availability_school_enabled_idx" ON "question_availability" USING btree ("school_id","is_enabled");--> statement-breakpoint
CREATE INDEX "question_availability_question_idx" ON "question_availability" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "question_availability_enabled_idx" ON "question_availability" USING btree ("is_enabled");--> statement-breakpoint
CREATE INDEX "video_ratings_user_video_unique_idx" ON "video_ratings" USING btree ("user_id","video_id");--> statement-breakpoint
CREATE INDEX "video_ratings_video_id_idx" ON "video_ratings" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "video_ratings_user_id_idx" ON "video_ratings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "voice_narration_user_week_idx" ON "voice_narration_usage" USING btree ("user_id","week_start");--> statement-breakpoint
CREATE INDEX "voice_narration_user_date_idx" ON "voice_narration_usage" USING btree ("user_id","usage_date");--> statement-breakpoint
CREATE INDEX "voice_narration_weekly_usage_idx" ON "voice_narration_usage" USING btree ("week_start","usage_count");