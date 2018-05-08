import csv
import sys
import requests
from bs4 import BeautifulSoup

courseId = sys.argv[1]
invertColumns = sys.argv[2] == 'i' if len(sys.argv) > 2 else False

# load course overview page
courseUrl = 'https://www.memrise.com/course/' + courseId
response = requests.get(courseUrl)
if response.status_code != 200:
	print('Could not load course from Memrise...')
	exit()
courseUrl = response.url

# load chapter pages
print('Loading chapters...')
pages = []
chapter = 1
hasNextChapter = True
while hasNextChapter:
	chapterUrl = courseUrl + str(chapter) + '/'
	response = requests.get(chapterUrl)
	if response.status_code != 200 or response.url == courseUrl:
		hasNextChapter = False
		break
	html = response.text
	pages.append(html)
	print(chapter)
	chapter += 1

print('This course has ' + str(len(pages)) + ' chapters')

# prompt some data from user
fileName = input('Please enter a filename for the deck to be generated (without ending): ')
deckName = input('Please enter a name for the deck: ')
front = input('Please enter the two-letter language code for the front language: ')
back = input('Please enter the two-letter language code for the back language: ')

# parse chapters
rows = [[deckName], [front, back, 'Thema']]
for html in pages:
	soup = BeautifulSoup(html, 'html.parser')
	headings = soup.findAll('h3')
	if len(headings) > 0:
		chapterName = headings[0].text.strip()
	else:
		chapterName = str(soup.title.string).strip()
	divs = soup.findAll('div', {'class':'text'})
	words = [div.text.strip() for div in divs if 'col text"' not in str(div)]
	for i in range(0, len(words)):
		if i % 2 == 1 or i == len(words) - 1:
			continue
		if invertColumns:
			front = words[i]
			back = words[i+1]
		else:
			front = words[i+1]
			back = words[i]
		front = front.replace('‹', '').replace('›', '')
		back = back.replace('‹', '').replace('›', '')
		if i == 0:
			rows.append([front, back, chapterName])
		else:
			rows.append([front, back])

# write csv file
with open(fileName + '.csv', 'w') as csvfile:
	writer = csv.writer(csvfile, dialect = csv.excel_tab)
	writer.writerows(rows)
	print('Successfully generated CSV file with ' + str(len(rows)) + ' lines')



