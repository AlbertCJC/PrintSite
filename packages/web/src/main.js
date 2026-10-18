import { renderCustomerPage } from './customer.js'
import { renderAdminPage } from './admin.js'

const app = document.getElementById('app')

function router() {
  const path = window.location.pathname
  app.innerHTML = ''

  if (path === '/admin' || path === '/admin/') {
    renderAdminPage(app)
  } else {
    renderCustomerPage(app)
  }
}

window.addEventListener('popstate', router)
router()
