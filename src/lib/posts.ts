import { getCollection } from 'astro:content';

// 초안(draft: true)은 배포 사이트에 나오지 않는다. 로컬 .env에 SHOW_DRAFTS=true면 미리보기에서 보인다.
const SHOW_DRAFTS = import.meta.env.SHOW_DRAFTS === 'true';

export async function publishedPosts() {
  const posts = await getCollection('posts', ({ data }) => SHOW_DRAFTS || !data.draft);
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}
