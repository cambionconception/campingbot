

const puppeteer = require('puppeteer');

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
(async  () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://www.recreation.gov/camping/campsites/103904');
    
    const button = await page.$("#site-availability-section > div.camp-site-availability-section > div.camp-site-availability-calendar > div > div > div:nth-child(1) > div.DayPicker_focusRegion.DayPicker_focusRegion_1 > div.DayPickerNavigation.DayPickerNavigation_1.DayPickerNavigation__horizontal.DayPickerNavigation__horizontal_2 > div:nth-child(2) > div");
    
    await timeout(1000);
    await button.click();
    await timeout(1000);

    
    const childNodes = await page.evaluate(() => {
        const list = [];
        const children = document.querySelector('#site-availability-section > div.camp-site-availability-section > div.camp-site-availability-calendar > div > div > div:nth-child(1) > div.DayPicker_focusRegion.DayPicker_focusRegion_1 > div.DayPicker_transitionContainer.DayPicker_transitionContainer_1.DayPicker_transitionContainer__horizontal.DayPicker_transitionContainer__horizontal_2 > div > div:nth-child(2) > div > table > tbody').children;
        for (var i = 0; i < children.length; i++) {
            const grandchildren = children[i].children;
            for (var j = 0; j < grandchildren.length; j++) {
                const arialabel = grandchildren[j].getAttribute('aria-label');
                list.push(arialabel);
            }


            }
            
        return list;
        })
    

    

    console.log(childNodes);
    
    
    const thedata = await page.$("#site-availability-section > div.camp-site-availability-section > div.camp-site-availability-calendar > div > div > div:nth-child(1) > div.DayPicker_focusRegion.DayPicker_focusRegion_1 > div.DayPicker_transitionContainer.DayPicker_transitionContainer_1.DayPicker_transitionContainer__horizontal.DayPicker_transitionContainer__horizontal_2 > div > div:nth-child(2) > div > table");
    const element_html = await thedata.getProperty('innerHTML');
    const inner_html = await element_html.jsonValue();

    await button.click();
    await timeout(1000);

    const thedata2 = await page.$("#site-availability-section > div.camp-site-availability-section > div.camp-site-availability-calendar > div > div > div:nth-child(1) > div.DayPicker_focusRegion.DayPicker_focusRegion_1 > div.DayPicker_transitionContainer.DayPicker_transitionContainer_1.DayPicker_transitionContainer__horizontal.DayPicker_transitionContainer__horizontal_2 > div > div:nth-child(2) > div > table");
    const element_html2 = await thedata2.getProperty('innerHTML');
    const inner_html2 = await element_html2.jsonValue();

    await button.click();
    await timeout(1000);

    const thedata3 = await page.$("#site-availability-section > div.camp-site-availability-section > div.camp-site-availability-calendar > div > div > div:nth-child(1) > div.DayPicker_focusRegion.DayPicker_focusRegion_1 > div.DayPicker_transitionContainer.DayPicker_transitionContainer_1.DayPicker_transitionContainer__horizontal.DayPicker_transitionContainer__horizontal_2 > div > div:nth-child(2) > div > table");
    const element_html3 = await thedata3.getProperty('innerHTML');
    const inner_html3 = await element_html3.jsonValue();
    //console.log(inner_html + inner_html2 + inner_html3);
    await browser.close();


  })();


