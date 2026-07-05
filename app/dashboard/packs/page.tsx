import { getInterviewPacksForUser } from "@/lib/interview-packs/server";
import type { InterviewPackRecord } from "@/lib/interview-packs/types";
import { getAuthedClient } from "@/lib/jobs/server";
import InterviewPackWorkspace from "@/components/interview-packs/interview-pack-workspace";

export default async function DashboardPacksPage() {
  const { user } = await getAuthedClient();

  let interviewPacks: InterviewPackRecord[] = [];
  let interviewPacksTableMissing = false;

  try {
    interviewPacks = await getInterviewPacksForUser(user.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    interviewPacksTableMissing =
      message.includes("public.interview_packs") ||
      message.includes("Could not find the table");

    if (!interviewPacksTableMissing) {
      throw error;
    }
  }

  return <InterviewPackWorkspace packs={interviewPacks} packsTableMissing={interviewPacksTableMissing} />;
}
