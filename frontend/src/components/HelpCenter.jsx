import { useState } from 'react';
import { FaQuestionCircle, FaChevronDown, FaChevronUp, FaSearch } from 'react-icons/fa';

const HelpCenter = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const faqs = [
    {
      category: 'account',
      question: 'How do I reset my password?',
      answer: 'You can reset your password by going to the Password Management section in your profile settings. You\'ll need to enter your current password and then set a new one.'
    },
    {
      category: 'account',
      question: 'How do I update my profile information?',
      answer: 'Navigate to the Profile tab and click on "Edit Profile". You can update your name, phone number, and other personal details. Some fields may require verification by our staff.'
    },
    {
      category: 'loans',
      question: 'How do I apply for a loan?',
      answer: 'Click on "New Application" in the navigation menu. Fill out the loan application form with the required information including loan amount, duration, and purpose. You can also upload supporting documents. Once submitted, our team will review your application.'
    },
    {
      category: 'loans',
      question: 'How long does loan approval take?',
      answer: 'Loan applications are typically reviewed within 3-5 business days. You\'ll receive a notification once your application has been reviewed. The approval time may vary depending on the loan amount and completeness of your application.'
    },
    {
      category: 'loans',
      question: 'What documents do I need to apply for a loan?',
      answer: 'Required documents typically include: National ID, proof of income (pay slips, bank statements), utility bills, and any collateral documents if applicable. Specific requirements may vary based on the loan type.'
    },
    {
      category: 'loans',
      question: 'Can I have multiple loans at the same time?',
      answer: 'Yes, you can have multiple loans, subject to approval. Each loan application is evaluated based on your repayment capacity and credit history.'
    },
    {
      category: 'payments',
      question: 'How do I make a loan payment?',
      answer: 'You can make payments through bank transfer, mobile money, or in person at our branch offices. Contact your loan officer for specific payment instructions and account details.'
    },
    {
      category: 'payments',
      question: 'What happens if I miss a payment?',
      answer: 'If you miss a payment, you\'ll receive reminders and may incur late payment fees. It\'s important to contact us as soon as possible if you\'re having difficulty making payments. We can discuss restructuring options.'
    },
    {
      category: 'payments',
      question: 'Can I pay off my loan early?',
      answer: 'Yes, you can make early repayments. Some loan products may have early repayment fees, so please check your loan agreement or contact your loan officer for details.'
    },
    {
      category: 'documents',
      question: 'How do I upload documents?',
      answer: 'Go to the Documents tab and click "Upload New Document". Select the document type, name it, and choose the files to upload. Accepted formats include PDF, JPG, PNG, and Word documents.'
    },
    {
      category: 'documents',
      question: 'Why do I need to upload documents?',
      answer: 'Documents are required for verification purposes and to process your loan application. They help us verify your identity, income, and other important information.'
    },
    {
      category: 'notifications',
      question: 'How do I manage my notifications?',
      answer: 'You can view all notifications in the Notifications tab. You can mark notifications as read or dismiss them. Important notifications about your loans and payments will be sent to your email and shown in the portal.'
    },
    {
      category: 'security',
      question: 'Is my information secure?',
      answer: 'Yes, we use industry-standard encryption and security measures to protect your personal and financial information. Your data is stored securely and is only accessible to authorized personnel.'
    },
    {
      category: 'security',
      question: 'What should I do if I suspect unauthorized access?',
      answer: 'If you suspect unauthorized access to your account, immediately change your password and contact our support team. We will investigate and take appropriate action to secure your account.'
    }
  ];

  const categories = [
    { id: 'all', label: 'All Topics', icon: '📚' },
    { id: 'account', label: 'Account', icon: '👤' },
    { id: 'loans', label: 'Loans', icon: '💰' },
    { id: 'payments', label: 'Payments', icon: '💳' },
    { id: 'documents', label: 'Documents', icon: '📄' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'security', label: 'Security', icon: '🔒' }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FaQuestionCircle className="text-blue-600" />
          Help Center
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Find answers to frequently asked questions
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-gray-200 dark:border-gray-700">
        <div className="relative">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for help..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <span className="mr-2">{category.icon}</span>
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* FAQs */}
      <div className="space-y-3">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <span className="text-left font-semibold text-gray-900 dark:text-white">
                  {faq.question}
                </span>
                {expandedFaq === index ? (
                  <FaChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                ) : (
                  <FaChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                )}
              </button>
              
              {expandedFaq === index && (
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600">
                  <p className="text-gray-700 dark:text-gray-300">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <FaQuestionCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Results Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try a different search term or category
            </p>
          </div>
        )}
      </div>

      {/* Still Need Help? */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg p-6 text-white">
        <h3 className="text-xl font-bold mb-2">Still need help?</h3>
        <p className="mb-4 text-blue-100">
          Our support team is here to assist you with any questions or concerns.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => window.location.href = 'mailto:support@anchorfinance.com'}
            className="px-6 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
          >
            Email Support
          </button>
          <button
            onClick={() => window.location.href = 'tel:+250788000000'}
            className="px-6 py-2 bg-white/20 text-white border border-white rounded-lg hover:bg-white/30 transition-colors font-medium"
          >
            Call Us
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;

