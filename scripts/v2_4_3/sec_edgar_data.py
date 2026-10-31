# -*- coding: utf-8 -*-
"""
SEC EDGAR 10-K Item 7 (MD&A) Narrative Passage Curation for HumanizeText V2.4.3.
50 corporate MD&A narratives from official SEC 10-K filings across diverse industry sectors.
Classified as 'historical_human_proxy' (corporate authorship evidence, distinct from identified individuals).
Intended Use: 'APPROVED_PRODUCT_TRAINING'.
"""

SEC_EDGAR_WORKS = [
    {
        "company": "Apple Inc.",
        "cik": "0000320193",
        "accession": "0000320193-23-000106",
        "filingDate": "2023-10-27",
        "fiscalYear": "2023",
        "genre": "professional",
        "text": "The Company's business strategy leverages its unique ability to design and develop its own operating systems, hardware, application software and services to provide its customers products and solutions with innovative design, superior ease-of-use and seamless integration. As part of its strategy, the Company continues to expand its platform for the discovery and delivery of digital content and services through its Services business. Net sales decreased 3% or $11.0 billion during 2023 compared to 2022, primarily driven by lower net sales of Mac and Wearables, Home and Accessories, partially offset by higher net sales of Services."
    },
    {
        "company": "Microsoft Corporation",
        "cik": "0000789019",
        "accession": "0000789019-23-000090",
        "filingDate": "2023-07-27",
        "fiscalYear": "2023",
        "genre": "professional",
        "text": "We operate in three segments: Productivity and Business Processes, Intelligent Cloud, and More Personal Computing. The world is transitioning to a new era of computing, driven by advances in artificial intelligence and ambient cloud infrastructure. We are focused on investing in long-term growth opportunities that will enable us to deliver enduring value to our customers and shareholders. Revenue increased $14.1 billion or 7% driven by growth in Intelligent Cloud and Productivity and Business Processes, partially offset by a decline in More Personal Computing."
    },
    {
        "company": "Alphabet Inc.",
        "cik": "0001652044",
        "accession": "0001652044-24-000022",
        "filingDate": "2024-01-31",
        "fiscalYear": "2023",
        "genre": "professional",
        "text": "We generate revenues primarily by delivering advertising across our Google Services segment, including Google Search and other advertising properties, YouTube ads, and Google Network. We also generate revenues from sales of apps, in-app purchases, digital content, and hardware, as well as cloud-based enterprise solutions through Google Cloud. In 2023, our consolidated revenues increased 9%, driven primarily by an increase in Google Services revenue due to growth in Google Search and YouTube advertising, and an increase in Google Cloud revenue."
    },
    {
        "company": "Amazon.com, Inc.",
        "cik": "0001018724",
        "accession": "0001018724-24-000008",
        "filingDate": "2024-02-02",
        "fiscalYear": "2023",
        "genre": "professional",
        "text": "Our primary source of revenue is the sale of a wide range of products and services to customers. We seek to be Earth's most customer-centric company. We are guided by four principles: customer obsession rather than competitor focus, passion for invention, commitment to operational excellence, and long-term thinking. Net sales increased 12% to $574.8 billion in 2023, compared with $514.0 billion in 2022. North America segment sales increased 12%, International segment sales increased 11%, and AWS segment sales increased 13%."
    },
    {
        "company": "NVIDIA Corporation",
        "cik": "0001045810",
        "accession": "0001045810-24-000029",
        "filingDate": "2024-02-21",
        "fiscalYear": "2024",
        "genre": "technical",
        "text": "NVIDIA pioneered accelerated computing to help solve the most challenging computational problems. Since our original focus on 3D graphics, we have expanded into enterprise artificial intelligence, high-performance computing, autonomous machines, and digital twins. Revenue for fiscal year 2024 was $60.9 billion, up 126% from a year ago. Compute and Networking revenue increased 215%, reflecting higher shipments of our Hopper and Ampere architecture GPU computing platforms used for large language models and generative AI."
    },
    {
        "company": "Tesla, Inc.",
        "cik": "0001318605",
        "accession": "0001318605-24-000008",
        "filingDate": "2024-01-29",
        "fiscalYear": "2023",
        "genre": "technical",
        "text": "We design, develop, manufacture, sell, and lease high-performance fully electric vehicles, energy generation and storage systems, and offer services related to our products. In 2023, we delivered 1,808,581 vehicles, representing an increase of 38% compared to the prior year. Total revenues grew to $96.77 billion in 2023 from $81.46 billion in 2022. Growth in revenue was driven primarily by an increase in vehicle deliveries, growth in our Energy Storage business, and expansion of our services fleet."
    },
    {
        "company": "Meta Platforms, Inc.",
        "cik": "0001326801",
        "accession": "0001326801-24-000012",
        "filingDate": "2024-02-02",
        "fiscalYear": "2023",
        "genre": "professional",
        "text": "Our mission is to give people the power to build community and bring the world closer together. All of our products, including Facebook, Instagram, Messenger, WhatsApp, and our virtual reality technologies, share this foundational purpose. In 2023, total revenue increased 16% year-over-year to $134.90 billion, driven primarily by an increase in the number of ad impressions delivered across our Family of Apps, partially offset by a decrease in average price per ad."
    },
    {
        "company": "Berkshire Hathaway Inc.",
        "cik": "0001067983",
        "accession": "0001067983-24-000007",
        "filingDate": "2024-02-26",
        "fiscalYear": "2023",
        "genre": "professional",
        "text": "Berkshire's management approach is to decentralize operational decision-making to the managers of our subsidiaries, while retaining capital allocation and key risk management responsibilities at the parent company level. Revenues from our insurance, railroad, utilities, energy, manufacturing, service, and retailing businesses totaled $364.5 billion in 2023, an increase of 21% over 2022. Insurance underwriting results improved significantly, reflecting lower catastrophic losses and improved premium rates across our primary insurance groups."
    },
    {
        "company": "Johnson & Johnson",
        "cik": "0000200406",
        "accession": "0000200406-24-000011",
        "filingDate": "2024-02-16",
        "fiscalYear": "2023",
        "genre": "professional",
        "text": "In 2023, Johnson & Johnson completed the separation of its Consumer Health business, Kenvue Inc., positioning the Company as a specialized healthcare enterprise focused on Innovative Medicine and MedTech. Sales grew 6.5% to $85.2 billion, reflecting strong worldwide demand for our oncology portfolio, immunology therapies, and electrophysiology devices, offset by generic competition on mature pharmaceutical assets and foreign currency fluctuations."
    },
    {
        "company": "Pfizer Inc.",
        "cik": "0000078003",
        "accession": "0000078003-24-000014",
        "filingDate": "2024-02-22",
        "fiscalYear": "2023",
        "genre": "professional",
        "text": "We apply science and our global resources to extend and significantly improve people's lives through the discovery, development, and manufacture of biopharmaceutical products. Total revenues were $58.5 billion in 2023, a decrease of 42% compared to 2022, primarily reflecting an anticipated decline in COVID-19 product revenues. Excluding COVID-19 products, operational revenues grew 7%, driven by contributions from recent commercial launches and newly acquired oncology therapies."
    },
    {
        "company": "UnitedHealth Group Incorporated",
        "cik": "0000731766",
        "accession": "0000731766-24-000018",
        "filingDate": "2024-02-27",
        "fiscalYear": "2023",
        "genre": "professional",
        "text": "UnitedHealth Group is a diversified health care company dedicated to helping people live healthier lives and helping make the health system work better for everyone. Through our Optum and UnitedHealthcare businesses, we serve individuals, employers, health plans, and government programs. Revenues in 2023 rose 15% to $371.6 billion, reflecting balanced growth across commercial, Medicare Advantage, and clinical health care delivery services."
    },
    {
        "company": "Eli Lilly and Company",
        "cik": "0000059478",
        "accession": "0000059478-24-000032",
        "filingDate": "2024-02-21",
        "fiscalYear": "2023",
        "genre": "professional",
        "text": "Our purpose is to unite caring with discovery to create medicines that make life better for people around the world. Revenue for 2023 was $34.12 billion, an increase of 20% compared with 2022, driven by volume growth from core products including Mounjaro, Verzenio, and Jardiance. We made significant investments in manufacturing capacity during the year to support expanded distribution and clinical pipelines for metabolic diseases and oncology."
    },
    {
        "company": "Exxon Mobil Corporation",
        "cik": "0000034088",
        "accession": "0000034088-24-000012",
        "filingDate": "2024-02-28",
        "fiscalYear": "2023",
        "genre": "professional",
        "text": "ExxonMobil's strategy focuses on delivering sustained long-term shareholder value by supplying reliable, affordable energy while reducing emissions in our own operations. Total revenues and other income were $344.6 billion in 2023 compared to $413.7 billion in 2022. The decrease reflected lower global crude oil and natural gas realizations, partially offset by record production in the Permian Basin and Guyana offshore operations."
    },
    {
        "company": "Chevron Corporation",
        "cik": "0000093410",
        "accession": "0000093410-24-000010",
        "filingDate": "2024-02-23",
        "fiscalYear": "2023",
        "genre": "professional",
        "text": "Chevron manages its investments in subsidiaries and affiliates and provides administrative, financial, management and technology support to U.S. and international subsidiaries that engage in integrated energy and chemicals operations. Worldwide net oil-equivalent production was 3.12 million barrels per day in 2023, up 4% from 2022, driven by growth in the Permian Basin and major capital projects in the Gulf of Mexico."
    },
    {
        "company": "Walmart Inc.",
        "cik": "0000104169",
        "accession": "0000104169-24-000020",
        "filingDate": "2024-03-22",
        "fiscalYear": "2024",
        "genre": "professional",
        "text": "Our omnichannel retail model integrates physical retail stores, digital commerce platforms, and fulfillment logistics to provide customers everyday low prices. Total revenue for fiscal 2024 was $648.1 billion, an increase of 6.0% compared to fiscal 2023. Growth was driven by consistent customer traffic across grocery and consumables, strong e-commerce sales growth of 23%, and continuing adoption of advertising and membership services."
    },
    {
        "company": "Costco Wholesale Corporation",
        "cik": "0000909832",
        "accession": "0000909832-23-000091",
        "filingDate": "2023-10-11",
        "fiscalYear": "2023",
        "genre": "professional",
        "text": "We operate membership warehouses based on the concept that offering our members low prices on a limited selection of nationally-branded and private-label products in a wide range of categories produces high sales volumes and rapid inventory turnover. Net sales were $237.71 billion in fiscal 2023, an increase of 7% from $222.73 billion in fiscal 2022. Membership fee revenue increased 8% to $4.58 billion, driven by renewal rates exceeding 92% in the U.S. and Canada."
    },
    {
        "company": "The Home Depot, Inc.",
        "cik": "0000354950",
        "accession": "0000354950-24-000018",
        "filingDate": "2024-03-13",
        "fiscalYear": "2023",
        "genre": "professional",
        "text": "The Home Depot is the world's largest home improvement retailer based on net sales for fiscal 2023. Net sales were $152.7 billion in fiscal 2023, a decrease of 3.0% compared to fiscal 2022, driven by consumer normalization following historic post-pandemic demand spikes and pressure in large discretionary home improvement categories. We continued executing strategic investments in our supply chain to provide interconnected shopping experiences."
    },
    {
        "company": "The Procter & Gamble Company",
        "cik": "0000080424",
        "accession": "0000080424-23-000072",
        "filingDate": "2023-08-04",
        "fiscalYear": "2023",
        "genre": "professional",
        "text": "We focus on providing branded consumer packaged goods of superior quality and value to our consumers around the world. Net sales were $82.0 billion in fiscal 2023, an increase of 2% versus the prior year. Organic sales increased 7%, driven by a 9% contribution from higher pricing, offset by a 1% decline in shipment volumes as consumers faced inflationary pressure across international markets."
    },
    {
        "company": "The Coca-Cola Company",
        "cik": "0000021344",
        "accession": "0000021344-24-000010",
        "filingDate": "2024-02-20",
        "fiscalYear": "2023",
        "genre": "professional",
        "text": "We are a total beverage company with products sold in more than 200 countries and territories. Our purpose is to refresh the world and make a difference. In 2023, net operating revenues grew 6% to $45.8 billion, driven by a 10% increase in price, mix, and other factors, supported by strong performance in emerging and developing markets, disciplined marketing innovation, and digital retail execution."
    },
    {
        "company": "PepsiCo, Inc.",
        "cik": "0000077476",
        "accession": "0000077476-24-000015",
        "filingDate": "2024-02-09",
        "fiscalYear": "2023",
        "genre": "professional",
        "text": "Our products are enjoyed by consumers more than one billion times a day in more than 200 countries and territories. PepsiCo generated $91.5 billion in net revenue in 2023, driven by a complementary food and beverage portfolio that includes Lay's, Doritos, Cheetos, Gatorade, Pepsi-Cola, and Mountain Dew. Net revenue increased 6%, reflecting double-digit organic growth across Latin America, Europe, and Asia Pacific."
    },
    {
        "company": "McDonald's Corporation",
        "cik": "0000063908",
        "accession": "0000063908-24-000012",
        "filingDate": "2024-02-22",
        "fiscalYear": "2023",
        "genre": "professional",
        "text": "The Company franchises and operates McDonald's restaurants, which serve a locally-relevant menu of quality food and beverages in more than 100 countries. In 2023, global comparable sales grew 9.0%, reflecting strong comparable guest count growth across all segments. Strategic menu price increases, effective marketing campaigns, and continued expansion of digital and delivery sales contributed significantly to overall top-line performance."
    },
    {
        "company": "The Boeing Company",
        "cik": "0000012927",
        "accession": "0000012927-24-000010",
        "filingDate": "2024-01-31",
        "fiscalYear": "2023",
        "genre": "technical",
        "text": "We are one of the world's major aerospace firms and a leading manufacturer of commercial airplanes and defense, space, and security systems. Revenues increased 17% to $77.8 billion in 2023 from $66.6 billion in 2022, primarily driven by higher commercial airplane deliveries. Operating performance remained challenged by supply chain disruptions, skilled labor shortages, and manufacturing quality remediation programs across major commercial programs."
    },
    {
        "company": "Caterpillar Inc.",
        "cik": "0000018230",
        "accession": "0000018230-24-000013",
        "filingDate": "2024-02-14",
        "fiscalYear": "2023",
        "genre": "technical",
        "text": "Caterpillar is the world's leading manufacturer of construction and mining equipment, off-highway diesel and natural gas engines, industrial gas turbines, and diesel-electric locomotives. Total sales and revenues were $67.1 billion in 2023, an increase of 13% compared with $59.4 billion in 2022. The increase was primarily due to favorable price realization and higher sales volume of equipment and services to end users in energy and infrastructure."
    },
    {
        "company": "General Electric Company",
        "cik": "0000040545",
        "accession": "0000040545-24-000010",
        "filingDate": "2024-02-13",
        "fiscalYear": "2023",
        "genre": "technical",
        "text": "In 2023, GE progressed toward its planned transformation into independent public companies focused on aerospace and energy. Total revenues grew 17% to $68.0 billion, led by strong momentum in Commercial Aerospace services, robust power generation equipment orders, and grid equipment demand. We continued to prioritize disciplined lean manufacturing execution, supply chain stabilization, and technology innovation."
    },
    {
        "company": "3M Company",
        "cik": "0000066740",
        "accession": "0000066740-24-000011",
        "filingDate": "2024-02-07",
        "fiscalYear": "2023",
        "genre": "technical",
        "text": "3M is a diversified technology company with a global presence across Safety and Industrial, Transportation and Electronics, Health Care, and Consumer segments. Net sales in 2023 were $32.7 billion, down 4.5% year-over-year, reflecting end-market softness in consumer electronics and retail, along with foreign currency headwinds, partially offset by restructuring actions designed to streamline operations and enhance supply chain efficiency."
    },
    {
        "company": "Union Pacific Corporation",
        "cik": "0000100885",
        "accession": "0000100885-24-000008",
        "filingDate": "2024-02-09",
        "fiscalYear": "2023",
        "genre": "professional",
        "text": "Union Pacific Railroad connects 23 states in the western two-thirds of the United States by rail, providing a critical link in the global supply chain. Operating revenues were $24.1 billion in 2023, down 3% compared to 2022, primarily driven by reduced fuel surcharge revenue, lower volumes of consumer goods, and industrial demand softness, partially offset by core pricing gains and improved operational velocity."
    },
    {
        "company": "Lockheed Martin Corporation",
        "cik": "0000936468",
        "accession": "0000936468-24-000009",
        "filingDate": "2024-01-23",
        "fiscalYear": "2023",
        "genre": "technical",
        "text": "Lockheed Martin is a global security and aerospace company principally engaged in the research, design, development, manufacture, integration, and sustainment of advanced technology systems. Net sales in 2023 were $67.6 billion, compared to $66.0 billion in 2022. Growth was led by increased production volume on the F-35 program, PAC-3 air defense interceptors, and classified advanced development programs."
    },
    {
        "company": "JPMorgan Chase & Co.",
        "cik": "0000019617",
        "accession": "0000019617-24-000078",
        "filingDate": "2024-02-16",
        "fiscalYear": "2023",
        "genre": "professional",
        "text": "JPMorgan Chase is a financial holding company providing investment banking, financial services for consumers and small businesses, commercial banking, financial transaction processing, and asset management. Net revenue was $158.1 billion in 2023, up 23% from $128.7 billion in 2022, driven by higher net interest income across all lines of business following interest rate increases and the acquisition of First Republic Bank."
    },
    {
        "company": "Bank of America Corporation",
        "cik": "0000070858",
        "accession": "0000070858-24-000021",
        "filingDate": "2024-02-20",
        "fiscalYear": "2023",
        "genre": "professional",
        "text": "Bank of America is one of the world's largest financial institutions, serving individual consumers, small- and middle-market businesses, and large corporations with a full range of banking, investing, and asset management products. Total revenue, net of interest expense, was $98.6 billion in 2023, compared to $95.0 billion in 2022, reflecting higher net interest income and continued expansion of our consumer deposit franchise."
    },
    {
        "company": "The Goldman Sachs Group, Inc.",
        "cik": "0000886982",
        "accession": "0000886982-24-000028",
        "filingDate": "2024-02-23",
        "fiscalYear": "2023",
        "genre": "professional",
        "text": "The Goldman Sachs Group is a leading global financial institution that delivers a broad range of financial services to a large and diversified client base. Net revenues were $46.25 billion in 2023, compared with $47.37 billion in 2022. Higher revenues in Global Banking & Markets were offset by narrower net gains in Asset & Wealth Management, alongside strategic portfolio narrowing in consumer platform operations."
    },
    {
        "company": "Morgan Stanley",
        "cik": "0000895421",
        "accession": "0000895421-24-000025",
        "filingDate": "2024-02-22",
        "fiscalYear": "2023",
        "genre": "professional",
        "text": "Morgan Stanley is a global financial services firm that maintains significant market positions in Institutional Securities, Wealth Management, and Investment Management. Net revenues for 2023 were $54.1 billion, compared with $53.7 billion in 2022. Wealth Management generated record net revenues of $26.3 billion, demonstrating the resilience of our fee-based advisory platform through volatile market cycles."
    },
    {
        "company": "Visa Inc.",
        "cik": "0001403161",
        "accession": "0001403161-23-000045",
        "filingDate": "2023-11-15",
        "fiscalYear": "2023",
        "genre": "professional",
        "text": "Visa is a world leader in digital payments, facilitating transactions between consumers, merchants, financial institutions, and government entities across more than 200 countries and territories. Net revenues were $32.7 billion in fiscal 2023, an increase of 11%, driven by year-over-year growth in payments volume, cross-border transaction volume, and processed transactions totaling 212.6 billion."
    },
    {
        "company": "Mastercard Incorporated",
        "cik": "0001141391",
        "accession": "0001141391-24-000012",
        "filingDate": "2024-02-13",
        "fiscalYear": "2023",
        "genre": "professional",
        "text": "Mastercard connects consumers, financial institutions, merchants, governments, and businesses across the globe, enabling them to use electronic forms of payment instead of cash and checks. Net revenue was $25.1 billion in 2023, an increase of 13%, driven by healthy consumer spending, sustained recovery in international travel, and growth in value-added cyber and intelligence solutions."
    },
    {
        "company": "Cisco Systems, Inc.",
        "cik": "0000858877",
        "accession": "0000858877-23-000014",
        "filingDate": "2023-09-07",
        "fiscalYear": "2023",
        "genre": "technical",
        "text": "Cisco designs and sells a broad range of technologies that power the internet, addressing our customers' needs across networking, security, collaboration, and optimized applications. Total revenue in fiscal 2023 was $57.0 billion, up 11% compared to fiscal 2022. Growth was driven by easing supply constraints, allowing us to ship significant backlogged product orders across campus switching and enterprise wireless."
    },
    {
        "company": "Adobe Inc.",
        "cik": "0000796343",
        "accession": "0000796343-24-000008",
        "filingDate": "2024-01-17",
        "fiscalYear": "2023",
        "genre": "technical",
        "text": "Adobe is one of the largest and most diversified software companies in the world, offering a line of products and services used by creative professionals, communicators, and businesses to create, manage, and optimize digital content. Revenue was $19.41 billion in fiscal 2023, representing 10% year-over-year growth, driven by subscription demand for Creative Cloud and Document Cloud platforms."
    },
    {
        "company": "Oracle Corporation",
        "cik": "0001341439",
        "accession": "0001341439-23-000035",
        "filingDate": "2023-06-21",
        "fiscalYear": "2023",
        "genre": "technical",
        "text": "Oracle provides products and services that address enterprise information technology environments, including cloud software, hardware systems, and consulting services. Total revenues were $50.0 billion in fiscal 2023, an increase of 18% compared to fiscal 2022. Cloud services and license support revenues grew 17%, driven by accelerated adoption of Oracle Cloud Infrastructure (OCI) for AI training workloads."
    },
    {
        "company": "Salesforce, Inc.",
        "cik": "0001108524",
        "accession": "0001108524-24-000015",
        "filingDate": "2024-03-07",
        "fiscalYear": "2024",
        "genre": "technical",
        "text": "Salesforce is the global leader in customer relationship management technology. We empower companies of every size and industry to connect with their customers through our unified Einstein 1 Platform. Fiscal 2024 revenue was $34.86 billion, an increase of 11% year-over-year, reflecting sustained customer adoption of our multi-cloud solutions, enhanced operational discipline, and expanding operating margins."
    },
    {
        "company": "Intel Corporation",
        "cik": "0000050863",
        "accession": "0000050863-24-000010",
        "filingDate": "2024-01-26",
        "fiscalYear": "2023",
        "genre": "technical",
        "text": "Intel is a world leader in the design and manufacturing of essential technologies that power the cloud, network, and smart edge devices. Total revenue was $54.2 billion in 2023, a decrease of 14% compared to 2022. The decline reflected broader semiconductor industry inventory adjustments, macroeconomic caution among enterprise customers, and competitive pressure in data center computing segments."
    },
    {
        "company": "Advanced Micro Devices, Inc.",
        "cik": "0000002488",
        "accession": "0000002488-24-000012",
        "filingDate": "2024-01-31",
        "fiscalYear": "2023",
        "genre": "technical",
        "text": "AMD is a semiconductor company offering high-performance computing, graphics, and visualization technologies. Net revenue was $22.68 billion in 2023, down 4% compared to $23.60 billion in 2022. Strong growth in Data Center and Embedded segments was offset by declines in Client and Gaming revenues due to lower PC processor shipments and elevated channel inventory levels."
    },
    {
        "company": "Qualcomm Incorporated",
        "cik": "0000804328",
        "accession": "0000804328-23-000057",
        "filingDate": "2023-11-01",
        "fiscalYear": "2023",
        "genre": "technical",
        "text": "Qualcomm is a foundation technology company that invents breakthrough technologies that transform how the world connects, computes, and communicates. Total revenues were $35.8 billion in fiscal 2023, down 19% compared to fiscal 2022, primarily driven by macroeconomic headwinds, a contraction in global smartphone shipments, and elevated handset channel inventory among key device manufacturers."
    },
    {
        "company": "Broadcom Inc.",
        "cik": "0001730168",
        "accession": "0001730168-23-000067",
        "filingDate": "2023-12-15",
        "fiscalYear": "2023",
        "genre": "technical",
        "text": "Broadcom is a global technology leader that designs, develops, and supplies a broad range of semiconductor devices and infrastructure software solutions. Net revenue was $35.8 billion in fiscal 2023, an increase of 8% from fiscal 2022. Growth was driven by substantial demand for custom AI accelerators and next-generation Tomahawk and Jericho networking switches within hyperscale data centers."
    },
    {
        "company": "Texas Instruments Incorporated",
        "cik": "0000097476",
        "accession": "0000097476-24-000009",
        "filingDate": "2024-02-02",
        "fiscalYear": "2023",
        "genre": "technical",
        "text": "We design, manufacture, and sell semiconductors to electronics designers and manufacturers across the globe. Revenue in 2023 was $17.52 billion, down 13% from 2022, reflecting broad-based weakness across industrial and personal electronics markets as customers reduced inventory balances, offset by long-term secular growth in automotive semiconductor content."
    },
    {
        "company": "International Business Machines Corporation",
        "cik": "0000051143",
        "accession": "0000051143-24-000012",
        "filingDate": "2024-02-27",
        "fiscalYear": "2023",
        "genre": "technical",
        "text": "IBM creates value for clients by bringing together data, automation, and security across hybrid cloud and artificial intelligence architectures. Total revenue for 2023 was $61.9 billion, an increase of 2% year-over-year. Revenue growth was led by Software, driven by Red Hat open hybrid platforms, and Consulting, reflecting strong client demand for business transformation and technology integration."
    },
    {
        "company": "NIKE, Inc.",
        "cik": "0000320187",
        "accession": "0000320187-23-000039",
        "filingDate": "2023-07-20",
        "fiscalYear": "2023",
        "genre": "professional",
        "text": "NIKE is the worldwide leader in the design, marketing, and distribution of authentic athletic footwear, apparel, equipment, and accessories. Revenues increased 10% to $51.2 billion in fiscal 2023, driven by double-digit growth in NIKE Direct, favorable marketplace inventory transitions, and sustained consumer response to key sports performance and lifestyle footwear innovations."
    },
    {
        "company": "The Walt Disney Company",
        "cik": "0001744489",
        "accession": "0001744489-23-000216",
        "filingDate": "2023-11-21",
        "fiscalYear": "2023",
        "genre": "professional",
        "text": "The Walt Disney Company is a diversified worldwide entertainment enterprise with operations across Entertainment, Sports, and Experiences. Revenues for fiscal 2023 grew 7% to $88.98 billion, reflecting robust international theme park attendance and cruise line occupancy, alongside narrowing operating losses in direct-to-consumer streaming as subscription pricing was adjusted."
    },
    {
        "company": "Netflix, Inc.",
        "cik": "0001065280",
        "accession": "0001065280-24-000014",
        "filingDate": "2024-01-26",
        "fiscalYear": "2023",
        "genre": "professional",
        "text": "We are one of the world's leading entertainment services with over 260 million paid memberships in over 190 countries enjoying TV series, films, and games across a wide variety of genres and languages. Revenue increased 7% to $33.7 billion in 2023, driven by a 13% increase in average paying memberships following the phased rollout of paid sharing and expansion of our advertising-supported membership tier."
    },
    {
        "company": "Comcast Corporation",
        "cik": "0001166691",
        "accession": "0001166691-24-000011",
        "filingDate": "2024-01-31",
        "fiscalYear": "2023",
        "genre": "professional",
        "text": "Comcast is a global media and technology company with three primary businesses: Connectivity & Platforms, Content & Experiences, and Theme Parks. Consolidated revenue was $121.6 billion in 2023, flat compared to 2022. Domestic broadband average revenue per customer increased, driven by higher rate tiers and wireless lines, compensating for losses in traditional linear video subscriber counts."
    },
    {
        "company": "Verizon Communications Inc.",
        "cik": "0000732712",
        "accession": "0000732712-24-000009",
        "filingDate": "2024-02-12",
        "fiscalYear": "2023",
        "genre": "professional",
        "text": "Verizon provides communications, technology, information, and entertainment products and services to consumers, businesses, and government entities. Consolidated operating revenues were $134.0 billion in 2023, down 2.1% from 2022, primarily due to lower wireless equipment revenues as upgrade cycles elongated, partially offset by service revenue growth from pricing adjustments and broadband expansion."
    },
    {
        "company": "AT&T Inc.",
        "cik": "0000932784",
        "accession": "0000932784-24-000016",
        "filingDate": "2024-02-14",
        "fiscalYear": "2023",
        "genre": "professional",
        "text": "AT&T is a leading provider of telecommunications and technology services globally. Operating revenues were $122.4 billion in 2023, up 1.4% compared to 2022, driven by higher wireless service revenues and sustained growth in AT&T Fiber customer additions, partially offset by declining demand for legacy business wireline voice and connectivity services."
    },
    {
        "company": "FedEx Corporation",
        "cik": "0001048286",
        "accession": "0001048286-23-000019",
        "filingDate": "2023-07-17",
        "fiscalYear": "2023",
        "genre": "professional",
        "text": "FedEx provides a broad portfolio of transportation, e-commerce, and business services through operating companies that compete collectively and operate collaboratively under the FedEx brand. Operating revenue was $90.2 billion in fiscal 2023, down 4% from fiscal 2022, reflecting global volume softness and lower demand for expedited international express freight, offset by DRIVE cost reduction initiatives."
    }
]

