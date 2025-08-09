import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Menu } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';

export default function POSLayout({ children }) {
  const { url, auth } = usePage().props;
  const user = auth?.user;
  const isActive = (href) => url && url.startsWith(href);

  return (
    <div className="min-h-screen flex font-sans bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-mu-blue text-white shadow-md">
        <div className="p-6 text-center text-xl font-bold border-b border-mu-gold">
          <img src="/logo.gif" alt="MU Logo" className="w-12 h-12 mx-auto mb-2" />
          MU POS
        </div>
        <nav className="p-4 space-y-2">
          <Link className={`block px-4 py-2 rounded hover:bg-mu-gold hover:text-mu-blue ${isActive('/cafeteria') ? 'bg-mu-gold text-mu-blue' : ''}`} href="/cafeteria">POS Home</Link>
          <Link className={`block px-4 py-2 rounded hover:bg-mu-gold hover:text-mu-blue ${isActive('/menu-items') ? 'bg-mu-gold text-mu-blue' : ''}`} href="/menu-items">Menu Items</Link>
          <Link className={`block px-4 py-2 rounded hover:bg-mu-gold hover:text-mu-blue ${isActive('/orders') ? 'bg-mu-gold text-mu-blue' : ''}`} href="/orders">Orders</Link>
          <Link className={`block px-4 py-2 rounded hover:bg-mu-gold hover:text-mu-blue ${isActive('/inventory-logs') ? 'bg-mu-gold text-mu-blue' : ''}`} href="/inventory-logs">Inventory Logs</Link>
          <Link className={`block px-4 py-2 rounded hover:bg-mu-gold hover:text-mu-blue ${isActive('/payments-receipts') ? 'bg-mu-gold text-mu-blue' : ''}`} href="/payments-receipts">Payments & Receipts</Link>
        </nav>
      </aside>

      {/* Topbar & Content */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="bg-white shadow flex items-center justify-end h-16 px-6 border-b">
          <Menu as="div" className="relative inline-block">
            <Menu.Button className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-mu-gold text-mu-blue rounded-md shadow hover:bg-yellow-400 transition">
              {user?.name}
              <ChevronDownIcon className="w-4 h-4" />
            </Menu.Button>
            <Menu.Items className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-md z-50">
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <Link href={route('profile.edit')} className={`block px-4 py-2 text-sm ${active ? 'bg-gray-100' : ''}`}>
                      Profile
                    </Link>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <Link method="post" href={route('logout')} as="button" className={`block w-full text-left px-4 py-2 text-sm ${active ? 'bg-gray-100' : ''}`}>
                      Log Out
                    </Link>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Menu>
        </header>

        {/* Main Content */}
        <main className="p-6 bg-white flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
