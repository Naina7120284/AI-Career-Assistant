'use client'

import { useEffect, useState } from 'react'

import { Bookmark } from 'lucide-react'
import { useUser } from '@/hooks/useUser'

interface SavedItem {
  id: string
  job_id: string
  title: string
  company: string
  location: string
  type: string
  work_mode: string
  experience: string
  category: string
  logo: string
  saved_date: string
}

export default function SavedPage() {
  const { isLoggedIn, loading: userLoading } =
    useUser()

  const [items, setItems] = useState<
    SavedItem[]
  >([])

  const [activeTab, setActiveTab] =
    useState('All')

  const [loading, setLoading] =
    useState(true)

  const [demoMode, setDemoMode] =
    useState(false)

  const [currentPage, setCurrentPage] =
    useState(1)

  const itemsPerPage = 5

  useEffect(() => {
    if (userLoading) return

    if (!isLoggedIn) {
      setLoading(false)
      return
    }

    loadSavedItems()
  }, [userLoading, isLoggedIn])

  const loadSavedItems = async () => {
    try {
      const response = await fetch('/api/saved')

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      setItems(data.items || [])
      setDemoMode(!!data.demo)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleUnsave = async (
    jobId: string
  ) => {
    try {
      const response = await fetch(
        '/api/saved',
        {
          method: 'DELETE',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            job_id: jobId,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      setItems((prev) =>
        prev.filter(
          (item) => item.job_id !== jobId
        )
      )
    } catch (error) {
      console.error(error)
    }
  }

  const tabs = [
    'All',
    'Jobs',
    'Courses',
    'Articles',
    'Documents',
  ]

  const filteredItems =
    activeTab === 'All'
      ? items
      : items.filter(
          (item) =>
            item.category === activeTab
        )

  const totalPages = Math.ceil(
    filteredItems.length / itemsPerPage
  )

  const startIndex =
    (currentPage - 1) * itemsPerPage

  const paginatedItems =
    filteredItems.slice(
      startIndex,
      startIndex + itemsPerPage
    )

  if (
    userLoading ||
    (loading && isLoggedIn)
  ) {
    return (
      <div className='p-10 text-lg'>
        Loading...
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-[#f7f9fc] px-6'>
        <div className='w-full max-w-lg rounded-[20px] border border-[#edf1f7] bg-white p-6 shadow-sm text-center'>
          <h1 className='text-2xl font-bold text-[#101828]'>
            Saved
          </h1>

          <p className='mt-3 text-[#667085]'>
            Log in to see your saved
            jobs and resources.
          </p>

          <a
            href='/login?next=/saved'
            className='inline-flex mt-5 h-10 rounded-xl items-center justify-center bg-[#f6c744] px-6 font-semibold text-black hover:opacity-90'
          >
            Go to Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-[#f7f9fc] px-4 py-4'>
      <div className='mx-auto max-w-5xl'>
        {/* Header */}

        <h1 className='text-3xl font-bold text-[#101828]'>
          Saved
        </h1>

        <p className='mt-1 text-sm text-[#667085]'>
          Your saved items and
          resources.
        </p>

        {demoMode && (
          <p className='mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900'>
            Showing sample saved
            items.
          </p>
        )}

        {/* Tabs */}

        <div className='mt-6 flex gap-5 border-b border-[#edf1f7] overflow-x-auto'>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab)
                setCurrentPage(1)
              }}
              className={`pb-3 text-sm font-medium whitespace-nowrap transition ${
                activeTab === tab
                  ? 'border-b-2 border-[#f5b301] text-[#101828]'
                  : 'text-[#667085]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Saved List */}

        <div className='mt-6 overflow-hidden rounded-[20px] border border-[#edf1f7] bg-white shadow-sm'>
          {filteredItems.length === 0 ? (
            <div className='flex items-center justify-center py-14 text-sm text-[#667085]'>
              No saved{' '}
              {activeTab.toLowerCase()}{' '}
              found.
            </div>
          ) : (
            paginatedItems.map(
              (item, index) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between px-5 py-4 ${
                    index !==
                    paginatedItems.length -
                      1
                      ? 'border-b border-[#edf1f7]'
                      : ''
                  }`}
                >
                  {/* Left */}

                  <div className='flex items-center gap-4'>
                    {/* Logo */}

                    <div className='flex h-12 w-12 items-center justify-center rounded-full border border-[#edf1f7] bg-white p-2 overflow-hidden'>
                      <img
                        src={
                          item.logo ||
                          `https://img.logo.dev/${item.company
                            .toLowerCase()
                            .replace(
                              /\s+/g,
                              ''
                            )}.com`
                        }
                        alt={item.company}
                        className='max-h-full max-w-full object-contain'
                        onError={(e) => {
                          e.currentTarget.src =
                            `https://ui-avatars.com/api/?name=${item.company}&background=random`
                        }}
                      />
                    </div>

                    {/* Info */}

                    <div>
                      <h3 className='text-lg font-bold text-[#101828]'>
                        {item.title}
                      </h3>

                      <p className='mt-1 text-sm text-[#667085]'>
                        {item.company} •{' '}
                        {item.location}
                      </p>

                      {/* Tags */}

                      <div className='mt-2 flex flex-wrap gap-2'>
                        <span className='rounded-full bg-[#f5f7fb] px-3 py-1 text-xs font-medium text-[#667085]'>
                          {item.type}
                        </span>

                        <span className='rounded-full bg-[#f5f7fb] px-3 py-1 text-xs font-medium text-[#667085]'>
                          {item.work_mode}
                        </span>

                        <span className='rounded-full bg-[#f5f7fb] px-3 py-1 text-xs font-medium text-[#667085]'>
                          {item.experience}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right */}

                  <div className='flex items-center gap-3'>
                    <p className='text-xs text-[#667085]'>
                      Saved on{' '}
                      {item.saved_date}
                    </p>

                    <button
                      onClick={() =>
                        handleUnsave(
                          item.job_id
                        )
                      }
                      className='transition hover:scale-105'
                    >
                      <Bookmark className='h-5 w-5 fill-[#2563eb] text-[#2563eb]' />
                    </button>
                  </div>
                </div>
              )
            )
          )}

          {/* Pagination */}

          {totalPages > 1 && (
            <div className='flex items-center justify-center gap-3 border-t border-[#edf1f7] px-4 py-3'>
              <button
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.max(prev - 1, 1)
                  )
                }
                disabled={currentPage === 1}
                className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                  currentPage === 1
                    ? 'cursor-not-allowed opacity-40'
                    : 'hover:bg-[#f5f7fb]'
                }`}
              >
                ←
              </button>

              <span className='text-sm font-medium text-[#667085]'>
                Page {currentPage} of{' '}
                {totalPages}
              </span>

              <button
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(
                      prev + 1,
                      totalPages
                    )
                  )
                }
                disabled={
                  currentPage === totalPages
                }
                className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                  currentPage === totalPages
                    ? 'cursor-not-allowed opacity-40'
                    : 'hover:bg-[#f5f7fb]'
                }`}
              >
                →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}