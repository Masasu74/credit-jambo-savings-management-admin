import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock, FaBuilding, FaGlobe } from 'react-icons/fa';

const ContactInformation = () => {
  const branches = [
    {
      name: 'Main Office - Kigali',
      address: 'KN 123 St, Kigali City, Rwanda',
      phone: '+250 788 000 001',
      email: 'kigali@anchorfinance.com',
      hours: {
        weekdays: '8:00 AM - 5:00 PM',
        saturday: '9:00 AM - 1:00 PM',
        sunday: 'Closed'
      },
      manager: 'Jean Claude Murenzi'
    },
    {
      name: 'Musanze Branch',
      address: 'Musanze District, Northern Province, Rwanda',
      phone: '+250 788 000 002',
      email: 'musanze@anchorfinance.com',
      hours: {
        weekdays: '8:00 AM - 5:00 PM',
        saturday: '9:00 AM - 1:00 PM',
        sunday: 'Closed'
      },
      manager: 'Marie Uwase'
    },
    {
      name: 'Huye Branch',
      address: 'Huye District, Southern Province, Rwanda',
      phone: '+250 788 000 003',
      email: 'huye@anchorfinance.com',
      hours: {
        weekdays: '8:00 AM - 5:00 PM',
        saturday: '9:00 AM - 1:00 PM',
        sunday: 'Closed'
      },
      manager: 'Paul Kagame'
    }
  ];

  const contactMethods = [
    {
      icon: <FaPhone className="w-6 h-6" />,
      title: 'Phone Support',
      info: '+250 788 000 000',
      description: 'Call us Monday to Friday, 8 AM - 5 PM',
      action: 'Call Now',
      link: 'tel:+250788000000',
      color: 'bg-green-100 dark:bg-green-900/30 text-green-600'
    },
    {
      icon: <FaEnvelope className="w-6 h-6" />,
      title: 'Email Support',
      info: 'support@anchorfinance.com',
      description: 'We\'ll respond within 24 hours',
      action: 'Send Email',
      link: 'mailto:support@anchorfinance.com',
      color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
    },
    {
      icon: <FaGlobe className="w-6 h-6" />,
      title: 'Website',
      info: 'www.anchorfinance.com',
      description: 'Visit our website for more information',
      action: 'Visit Website',
      link: 'https://www.anchorfinance.com',
      color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FaMapMarkerAlt className="text-blue-600" />
          Contact Information
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Get in touch with us through any of our channels
        </p>
      </div>

      {/* Quick Contact Methods */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {contactMethods.map((method, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border border-gray-200 dark:border-gray-700"
          >
            <div className={`w-12 h-12 ${method.color} rounded-lg flex items-center justify-center mb-4`}>
              {method.icon}
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              {method.title}
            </h3>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {method.info}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {method.description}
            </p>
            <a
              href={method.link}
              target={method.link.startsWith('http') ? '_blank' : undefined}
              rel={method.link.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              {method.action}
            </a>
          </div>
        ))}
      </div>

      {/* Branch Locations */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FaBuilding className="text-blue-600" />
          Branch Locations
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {branches.map((branch, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border border-gray-200 dark:border-gray-700"
            >
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                {branch.name}
              </h4>

              <div className="space-y-3">
                {/* Address */}
                <div className="flex items-start gap-3">
                  <FaMapMarkerAlt className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {branch.address}
                    </p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-3">
                  <FaPhone className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <a
                      href={`tel:${branch.phone.replace(/\s/g, '')}`}
                      className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {branch.phone}
                    </a>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3">
                  <FaEnvelope className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                  <div>
                    <a
                      href={`mailto:${branch.email}`}
                      className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {branch.email}
                    </a>
                  </div>
                </div>

                {/* Hours */}
                <div className="flex items-start gap-3">
                  <FaClock className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Mon-Fri:</span> {branch.hours.weekdays}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Saturday:</span> {branch.hours.saturday}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Sunday:</span> {branch.hours.sunday}
                    </p>
                  </div>
                </div>

                {/* Manager */}
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Branch Manager: <span className="font-medium text-gray-900 dark:text-white">{branch.manager}</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-red-900 dark:text-red-300 mb-2 flex items-center gap-2">
          <FaPhone className="w-5 h-5" />
          Emergency Contact
        </h3>
        <p className="text-red-800 dark:text-red-400 mb-3">
          For urgent matters outside business hours, please contact:
        </p>
        <div className="flex flex-wrap gap-4">
          <a
            href="tel:+250788000999"
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            +250 788 000 999
          </a>
          <a
            href="mailto:emergency@anchorfinance.com"
            className="px-6 py-2 bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 border border-red-600 dark:border-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors font-medium"
          >
            emergency@anchorfinance.com
          </a>
        </div>
      </div>
    </div>
  );
};

export default ContactInformation;

