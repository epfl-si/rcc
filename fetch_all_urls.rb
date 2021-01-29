#!/bin/ruby
require 'fileutils'
require 'httparty'

cache=nil

trap("SIGINT") do 
	puts "Saving cache to cache_int.json"
	JSON.dump(cache, File.open("cache_int.json", 'w+'))		
	exit 130
end

def loc_from_xml(xml)
	sm=xml['sitemapindex']['sitemap']
	if sm.class == Array
		sm.map{|l| l['loc']}
	else
		[sm['loc']]
	end
end

def url_from_xml(xml)
	sm=xml['urlset']['url']
	if sm.class == Array
		sm.map{|l| l['loc']}
	else
		[sm['loc']]
	end
end

if File.exists?("cache.json")
	cache=JSON.load(File.new("cache.json"))
else
	cache={}
end

sites = cache['sites']
unless sites
	puts "Reading sites from wp-veritas"
	wpsites = HTTParty.get("https://wp-veritas.epfl.ch/api/v1/sites")
	sites = JSON.parse(wpsites.body).map{|s| s['url']}.select{ |l| l=~/^https:\/\/www.epfl.ch/ }
	cache['sites'] = sites
end

urlfile=File.open("urls.txt", 'a+')

begin
sites.each do |url|
	burl = "#{url}wp-sitemap.xml"
	next if cache[burl]
	response = HTTParty.get(burl)
	cache[burl] = response.code
	if response.code == 200
		puts "#{burl} -> #{response.code}"
		begin
			locs = loc_from_xml(response.parsed_response).select{|l| l=~/wp-sitemap-posts-page-1.xml/}
		rescue 
			STDERR.puts "   XXX 200 but not xml parsable"
			next
		end
		locs.each do |loc|
			unless cache[loc]
				r = HTTParty.get(loc)
				cache[loc] = r.code
				puts "  #{loc} -> #{r.code}"
				if  r.code == 200
					rxml = r.parsed_response
					loc_urls=url_from_xml(rxml)
					urlfile.puts(loc_urls.join("\n"))
				end
			else
				puts "  #{loc} -> cache"
			end
		end
	else
		STDERR.puts "XXX #{burl} -> #{response.code}"
	end
end
rescue
	puts "Saving cache to cache_rescue.json"
	JSON.dump(cache, File.open("cache_rescue.json", 'w+'))	
end

JSON.dump(cache, File.open("cache.json", 'w+'))