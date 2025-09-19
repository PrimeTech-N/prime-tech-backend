import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ArticleList = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:5000/articles')
      .then(res => {
        setArticles(res.data.articles);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching articles:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading articles...</p>;

  return (
    <div>
      <h2>Latest Articles</h2>
      {articles.map(article => (
        <div key={article._id} style={{ border: '1px solid #ccc', marginBottom: '1rem', padding: '1rem' }}>
          <h3>{article.title}</h3>
          <p>{article.content}</p>
          {article.imageUrl && (
            <img
              src={`http://localhost:5000${article.imageUrl}`}
              alt={article.title}
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          )}
          <p><strong>Author:</strong> {article.author?.username || 'Unknown'}</p>
          <p><em>Posted on:</em> {new Date(article.createdAt).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
};

export default ArticleList;
