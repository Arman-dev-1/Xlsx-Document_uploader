import ExcelImporter from '@/components/ExcelImporter';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Excel Data Importer
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Upload your Excel files and manage your data with ease
          </p>
        </div>
        <ExcelImporter />
      </div>
    </div>
  );
}