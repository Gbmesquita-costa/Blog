import { getPrismicClient } from '../services/prismic';
import { GetStaticProps } from 'next';
import { FiCalendar, FiUser } from "react-icons/fi"
import Header from '../components/Header';

import Prismic from "@prismicio/client"

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Link from 'next/link';
import { useState } from 'react';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale'

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  
  const postagem = postsPagination.results.map(post => {
    return {
      ...post,
      first_publication_date: format(
        new Date(post.first_publication_date),
        "dd MMM yyyy",
        {
          locale: ptBR
        }
        )
      }
    })
    
    const [posts, setPosts] = useState<Post[]>(postagem)
    const [page, setPage] = useState(postsPagination.next_page)
    const [pagenumeric, setPagenumeric] = useState(1)

    async function handleButton(): Promise<void> {
      if (pagenumeric !== 1 && page === null) {
        return
      }

      const postsResults = await fetch(`${page}`).then(response => response.json())

      setPage(postsResults.next_page)
      setPagenumeric(postsResults.page)

      const postagens = postsResults.results.map(post => {
        return {
          uid: post.uid,
          first_publication_date: format(
            new Date(post.first_publication_date),
            "dd MMM yyyy",
            {
              locale: ptBR
            }
          ),
          data: {
            title: post.data.title,
            subtitle: post.data.subtitle,
            author: post.data.author
          }
        }
      })
      
      setPosts(event => [...event, ...postagens])
    } 

    return(
      <>
        <Header />
        <main className={styles.container} >
          {posts.map(post => (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <a>
                <div className={styles.div}>
                  <strong>{post.data.title}</strong>

                  <p>{post.data.subtitle}</p>

                  <div className={commonStyles.common}>
                      <FiCalendar className={commonStyles.calendario}/>

                      <span>
                        {post.first_publication_date} 
                      </span>

                     
                      <FiUser className={commonStyles.user}/>

                      <span> 
                          {post.data.author}
                      </span>
                  </div>
                </div>
              </a>
            </Link>
          )) }

          { page ?  
          <button onClick={handleButton}>
            Carregar mais posts
          </button> : null
          }
        </main>
      </>
    )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query([
    Prismic.Predicates.at("document.type", "posts")
  ], {
    pageSize: 1
  });

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author
      }
    }
  })

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: posts
  }

  return {
    props: {
      postsPagination
    }
  }
};
