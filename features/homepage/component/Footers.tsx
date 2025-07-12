import { BookOpen, Mail, Phone, MapPin } from 'lucide-react'
import React from 'react'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-16 px-4">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">Maguru</span>
            </div>
            <p className="text-gray-400 leading-relaxed">
              Platform pembelajaran online terdepan di Indonesia. Wujudkan impian karir Anda bersama
              mentor expert.
            </p>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Mail className="w-4 h-4" />
                <span>hello@maguru.id</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Phone className="w-4 h-4" />
                <span>+62 21 1234 5678</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <MapPin className="w-4 h-4" />
                <span>Jakarta, Indonesia</span>
              </div>
            </div>
          </div>

          {/* Courses */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Courses</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a href="#" className="hover:text-white transition-colors duration-150">
                  Web Development
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors duration-150">
                  Mobile Development
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors duration-150">
                  UI/UX Design
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors duration-150">
                  Digital Marketing
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors duration-150">
                  Data Science
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Company</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a href="#" className="hover:text-white transition-colors duration-150">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors duration-150">
                  Our Team
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors duration-150">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors duration-150">
                  Press
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors duration-150">
                  Blog
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Support</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a href="#" className="hover:text-white transition-colors duration-150">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors duration-150">
                  Community
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors duration-150">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors duration-150">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors duration-150">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-gray-400 text-sm">© 2024 Maguru. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <a href="#" className="text-gray-400 hover:text-white transition-colors duration-150">
              Facebook
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors duration-150">
              Twitter
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors duration-150">
              Instagram
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors duration-150">
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
