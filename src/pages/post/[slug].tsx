import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import { FiUser, FiCalendar, FiClock } from "react-icons/fi"
import Prismic from "@prismicio/client"

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { useRouter } from 'next/router';
import Head  from 'next/head';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale'
import Header from '../../components/Header';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const totalwords = post.data.content.reduce((total, contentItem) => {
    total += contentItem.heading.split(' ').length

    const words = contentItem.body.map(item => item.text.split(' ').length)
    words.map(word => (total += word))
    return total
  }, 0)

  const readtime= Math.ceil(totalwords / 200)

  const router = useRouter()

  if (router.isFallback) {
    return <h1>Carregando...</h1>
  }

  const newDate = format(
    new Date(post.first_publication_date),
      "dd MMM yyyy",
    {
      locale: ptBR
    }
  )

  return (
    <>
      <Head>
        <title>{post.data.title} | spacetraveling</title>
      </Head>

      <Header />

      <div className={styles.img}>
        <img src={post.data.banner.url} alt="logo" />
      </div>

      <main className={styles.main}>
        <div className={styles.firstcontent}>
          <strong>{post.data.title}</strong>

          <div className={commonStyles.common}>
            <span>
              <FiCalendar className={commonStyles.calendario} /> {newDate}
            </span>

            <span>
              <FiUser className={commonStyles.user} /> {post.data.author}
            </span>

            <span>
              <FiClock className={commonStyles.clock} /> {`${readtime} min`}
            </span>

          </div>

          {post.data.content.map(content => {
            return (
              <div className={styles.content} key={content.heading}>

                <strong>{content.heading}</strong>

                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: RichText.asHtml(content.body)
                  }} 
                  />
                </div>
            )
          })}
        </div>
      </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at("document.type", "posts")
  ]);

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid
      }
    }
  })

  return {
    paths,
    fallback: true
  }
};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();
  const { slug } = context.params
  const response = await prismic.getByUID("posts", String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url
      },
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [ ...content.body]
        }
      })
    }
  }

  return {
    props: {
      post
    }
  }
};
