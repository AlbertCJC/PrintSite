import { renderCustomerPage } from './customer.js'

const app = document.getElementById('app')

function router() {
  const path = window.location.pathname
  app.innerHTML = ''

  if (path === '/admin' || path === '/admin/') {
    app.innerHTML = '<h1>Admin page — coming soon</h1>'
  } else {
    renderCustomerPage(app)
  }
}

window.addEventListener('popstate', router)
router()
