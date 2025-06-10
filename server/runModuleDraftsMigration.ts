import { addModuleDraftsTable } from "./migrations/addModuleDraftsTable";

async function runMigration() {
  try {
    console.log("Running module drafts migration...");
    await addModuleDraftsTable();
    console.log("Module drafts migration completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration();