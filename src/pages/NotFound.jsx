import SEO from '../components/SEO'

export default function NotFound() {
  return (
    <>
      <SEO
        title="Page Not Found - 404"
        description="The page you are looking for does not exist on FindMovies. Return to our homepage to discover amazing movies."
        noIndex={true}
      />
    <div className="text-center py-5">
      <h1 className="display-5 fw-bold">404</h1>
      <p className="lead text-muted">The page you are looking for does not exist.</p>
      <a href="/" className="btn btn-primary"><i className="fas fa-home me-1"></i>Go Home</a>
    </div>
    </>
  )
}
