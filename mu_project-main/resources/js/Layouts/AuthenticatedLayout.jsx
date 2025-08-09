import ApplicationLogo from '@/Components/ApplicationLogo';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Menu } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';

export default function AuthenticatedLayout({ header, children }) {
  const { auth } = usePage().props;
  const user = auth.user;
  const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 flex">

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r hidden sm:block">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-gray-700">
            <ApplicationLogo className="h-6 w-auto" />
            <span>Cafetería</span>
          </Link>
        </div>
        <nav className="mt-4 space-y-2 px-6">
          <NavLink href={route('cafeteria')} active={route().current('cafeteria')}>
            Dashboard
          </NavLink>
          <NavLink href={route('orders.index')} active={route().current('orders.index')}>
            Orders
          </NavLink>
          <NavLink href={route('menu-items.index')} active={route().current('menu-items.index')}>
            Menu Items
          </NavLink>
          <NavLink href={route('inventory.index')} active={route().current('inventory.index')}>
            Inventory Logs
          </NavLink>
          <NavLink href={route('orders.receipts_payments')} active={route().current('orders.receipts_payments')}>
            Payments
          </NavLink>
        </nav>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Top Nav */}
        <nav className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between items-center">
              <div className="flex items-center space-x-4 sm:hidden">
                <Link href="/" className="flex items-center gap-2 text-lg font-bold text-gray-700">
                  <ApplicationLogo className="h-6 w-auto" />
                  <span>Cafetería</span>
                </Link>
              </div>
              <div className="flex items-center">
                <Menu as="div" className="relative inline-block text-left">
                  <Menu.Button className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                    {user.name}
                    <ChevronDownIcon className="ml-2 -mr-1 h-5 w-5" />
                  </Menu.Button>
                  <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right bg-white border border-gray-200 divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href={route('profile.edit')}
                            className={`block px-4 py-2 text-sm text-gray-700 ${
                              active ? 'bg-gray-100' : ''
                            }`}
                          >
                            Profile
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            method="post"
                            href={route('logout')}
                            as="button"
                            className={`block w-full text-left px-4 py-2 text-sm text-gray-700 ${
                              active ? 'bg-gray-100' : ''
                            }`}
                          >
                            Log Out
                          </Link>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Menu>
              </div>
            </div>
          </div>
        </nav>

        {/* Header */}
        {header && (
          <header className="bg-white shadow">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">{header}</div>
          </header>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
