import { author, project } from '../data'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <h4>
            <span className="gradient-text">RS-Agent</span> · {project.title}
          </h4>
          <p>
            个人研究型项目:{project.period}。覆盖 RAG 检索、RL 对齐、多智能体调度与防泄漏评测的完整工程链路。
          </p>
        </div>
        <div className="footer-meta">
          <div>
            {author.name} · {author.role}
          </div>
          <div>{author.edu}</div>
          <div>
            <a href={`mailto:${author.email}`}>{author.email}</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
