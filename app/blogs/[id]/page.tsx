import { notFound } from 'next/navigation';
import { blogPosts } from '@/data/blogs';
import { BlogPostDetail } from '@/views/BlogPostDetail';
import { Metadata } from 'next';

interface BlogPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { id } = await params;
  const post = blogPosts.find((p) => p.id === id);
  
  if (!post) return { title: 'Post Not Found' };

  return {
    title: `${post.title} | FreeTool Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      authors: [post.author],
      publishedTime: post.date,
    },
  };
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { id } = await params;
  const post = blogPosts.find((p) => p.id === id);

  if (!post) {
    notFound();
  }

  return <BlogPostDetail post={post} />;
}

export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    id: post.id,
  }));
}
