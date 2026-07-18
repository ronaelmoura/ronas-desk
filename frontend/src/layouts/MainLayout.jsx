import { Outlet } from 'react-router-dom'

function MainLayout() {
  return (
    <div>
      <h1>Ronas Desk</h1>

      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout