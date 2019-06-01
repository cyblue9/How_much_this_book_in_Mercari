var DEBUG_MODE = false;

function trace(s) {
    if (DEBUG_MODE && this.console && typeof console.log != "undefined") {
        console.log(s);
    }
}

/*
 *    Delete subtitle
 *      EX:  ◯◯◯◯ -- △△△△  =>  ◯◯◯◯
 *           ◯◯◯◯ △△△△     =>  ◯◯◯◯
 *           ◯◯◯◯ 【△△△△】  =>  ◯◯◯◯
 *           ◯◯◯◯ 〈△△△△〉  =>  ◯◯◯◯
 *        ◯◯◯◯ is product title
 *        △△△△ is product subtitle
 *        but, When the number of product title characters is 9(min_search_title_len) or more characters, do not delete subtitle
 */
function Delete_subtitle(search_title) {
    trace("********** Delete_subtitle **********");
    trace(search_title);
    min_search_title_len = 9;

    // Ignoring (上) and (下)
    // In order to make many matches in search
    search_title = search_title.replace(/（[^（）]*）/g, "");
    search_title = search_title.replace(/<[^<>]*>/g, "");
    search_title = search_title.replace(/〈[^〈〉]*〉/g, "");
    search_title = search_title.replace(/＜[^＜＞]*＞/g, "");
    search_title = search_title.replace(/【[^【】]*】/g, "");
    search_title = search_title.replace(/〔[^〔〕]*〕/g, "");
    search_title = search_title.replace(/「[^「」]*」/g, "");

    // escape charcter
    search_title = search_title.replace(/\[[^\[\]]*\]/g, "");
    search_title = search_title.replace(/\([^()]*\)/g, "");
    search_title = search_title.replace(/\{[^{}]*\}/g, "");

    index = search_title.indexOf('―');
    if (index >= min_search_title_len)
        search_title = search_title.slice(0, index).trim();

    index = search_title.indexOf('-');
    if (index >= min_search_title_len)
        search_title = search_title.slice(0, index).trim();

    index = search_title.lastIndexOf(' ');
    if (index >= min_search_title_len)
        search_title = search_title.slice(0, index).trim();

    index = search_title.lastIndexOf('　');
    if (index >= min_search_title_len)
        search_title = search_title.slice(0, index).trim();

    index = search_title.lastIndexOf('~');
    if (index >= min_search_title_len)
        search_title = search_title.slice(0, index).trim();

    index = search_title.lastIndexOf(':');
    if (index >= min_search_title_len)
        search_title = search_title.slice(0, index).trim();

    trace(search_title + '\n');
    return search_title;
}

/*
 *    Delete edtion
 *      EX:  ○◯◯◯ 第△版  =>  ◯◯◯◯
 */
function Delete_edition(search_title) {
   trace("***** Delete edtion *****");
   trace(search_title);

   search_title_split = search_title.split(' ');
   if (search_title_split.length > 1) {
       for (i = 0; i < search_title_split.length; i++)
           search_title_split[i] = search_title_split[i].replace(/.*[0-9０-９]{1,}版.*/, "");
       search_title = search_title_split.join(" ").trim();
    }
    else {
       // No space
       search_title = search_title.replace(/第\d{1,}版/, "").trim();
       search_title = search_title.replace(/\d{1,}版/, "").trim();
    }

   trace(search_title + '\n');
   return search_title;
}
/*
 *    Delete other info
 *      EX:  ◯◯◯◯ 改訂版  =>  ◯◯◯◯
 *           図解 ◯◯◯◯   =>  ◯◯◯◯
 */
function Delete_other_info(search_title) {
    trace("***** Delete_other_info *****");
    trace(search_title);

    search_title = search_title.replace(/改訂版|改訂|図説|新版/g, "").trim();
    trace(search_title + '\n');
    return search_title;
}

/*
 *    Normalize product title for merukari search
 */
function doNormalization_product_title(product_title) {
    search_title = product_title;
    search_title = Delete_subtitle(search_title);
    search_title = Delete_edition(search_title);
    search_title = Delete_other_info(search_title);

    trace("amazon名: " + product_title);
    trace("メルカリ検索: " + search_title);
    return search_title;
}

/*
 *    Create merukari search api
 */
function Create_search_url(search_title, product_author) {
    url  = ""
    url += "https://www.mercari.com/jp/search/?sort_order=price_asc&keyword=";                                           // serach url
    url += search_title;                                                                                                 // serach keyword(search title)
    if (search_title.length <= 7)
      url += " " + product_author;                                                                                       // serach word(product author)
    url += "&category_root=5&category_child=&brand_name=&brand_id=&size_group=&price_min=&price_max=&status_on_sale=1";  // search condition
    trace("URL: " + url);
    return url;
}

/*
 *    Is item in merukari?
 *      YES: true
 *      NO : false
 */
function is_item_in_merukari(doc) {
    if (doc.getElementsByClassName("search-result-description")[0] != null) {
        trace("No item in merukari");
        return false;
    }
    return true;
}

/*
 *    Is item in search result?
 *      YES: true
 *      NO : false
 *
 *     Broad match of search title from search result
 */
function is_item_in_search_result(search_title, items_info) {
    for (var i = 0; i < items_info.length; i++) {
        item_name = items_info[i].getElementsByClassName("items-box-body")[0].getElementsByClassName("items-box-name")[0].innerText.trim();

        for (var j = 0; j < search_title.length; j++) {
          if(~item_name.indexOf(search_title.slice(j,j+1)))
            return true;
        }

        if (i == items_info.length - 1) {
            trace("No item in search result");
            return false;
        }
    }
}

/*
 *    Get items info by Search result (scrap items info page)
 */
function Get_items_info(search_title, responseText) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(responseText, "text/html");

    if (!is_item_in_merukari(doc))
        return [null, null];

    items_info = doc.getElementsByClassName("items-box-content clearfix")[0].getElementsByClassName("items-box");

    if (!is_item_in_search_result(search_title, items_info))
        return [null, null];

    item_min_price = items_info[0].getElementsByClassName("items-box-body")[0].getElementsByClassName("items-box-price")[0].innerText.slice(2);
    items_num = items_info.length;

    return [item_min_price, items_num];
}

/*
 *     Add merukari items info to amazon product page
 */
function Add_dom(item_min_price, items_num, link_url) {
    // Create olp-merukari tag
    var olp_merukari_tag = document.createElement("span");
    olp_merukari_tag.className = "olp-merukari olp-link";

    // Create a tag
    var a_tag = document.createElement("a");
    a_tag.className = "a-size-mini a-link-normal"
    a_tag.href = link_url;

    // Create olp-from tag
    var olp_from_tag = document.createElement("sapn");
    olp_from_tag.className = "olp-from";
    textNode = document.createTextNode(" より ");
    olp_from_tag.appendChild(textNode);

    // Append olp-from tag to a tag
    textNode = document.createTextNode("￥ " + item_min_price);
    a_tag.appendChild(textNode);
    a_tag.appendChild(olp_from_tag)

    // Append a tag to olp-merukari tag
    textNode = document.createTextNode(items_num + " メルカリの出品");
    a_tag.appendChild(textNode);
    olp_merukari_tag.appendChild(a_tag);

    // Append olp-merukari tag to tmm-olp-links tag
    tmm_olp_links_tag = document.getElementsByClassName("swatchElement selected")[0].getElementsByClassName("tmm-olp-links");
    tmm_olp_links_tag = tmm_olp_links_tag[tmm_olp_links_tag.length - 1];
    trace("tmm-olp-links-tag: ");
    trace(tmm_olp_links_tag);
    tmm_olp_links_tag.appendChild(olp_merukari_tag);
}

/*
 *    Search for items by merukari api (HTTP GET url)
 *      At that　request.readystate == 4 && request.status == 200,
 *      Get items info by merukari search result and Add dom element to Amazon product page
 */
function search_merukari(search_title, url){
    chrome.runtime.sendMessage({search_title: search_title, url: url},
        function (response_text) {
            var item_min_price, items_num;
            [item_min_price, items_num] = Get_items_info(search_title, response_text);
            if (item_min_price != null && items_num != null)
                Add_dom(item_min_price, items_num, url);
        });
}

/*
 *    Add merukari items info to amazon product page
 */
function Add_merukari_items_info_to_amazon_page(product_title, product_author) {
    search_title = doNormalization_product_title(product_title);
    url = Create_search_url(search_title, product_author);
    search_merukari(search_title, url);
}

/*
 *    main
 */
product_info     = document.getElementsByTagName('title')[0].innerText.split('|');
product_title    = product_info[0].trim();
product_author   = product_info[1].split(',')[0].trim();
product_category = product_info[2].trim();
product_sale     = product_info[3].trim();

if (product_category == "本" || product_sale == "Kindleストア" || product_sale == "本") // if product category is book or Kindleストア
    Add_merukari_items_info_to_amazon_page(product_title, product_author);
