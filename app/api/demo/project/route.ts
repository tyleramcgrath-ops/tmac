import { NextRequest } from 'next/server';
import { success, error } from '@/lib/api-response';
import { getDemoData, DEMO_PROJECTS } from '@/lib/demo/demo-data-generator';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectType = searchParams.get('type') || 'law_firm';

    if (!Object.keys(DEMO_PROJECTS).includes(projectType)) {
      return error('Invalid project type', 400);
    }

    const demoData = getDemoData(projectType);

    return success({
      message: 'Demo project data retrieved',
      data: demoData,
    });
  } catch (err) {
    console.error('Demo project error:', err);
    return error('Internal server error', 500);
  }
}
