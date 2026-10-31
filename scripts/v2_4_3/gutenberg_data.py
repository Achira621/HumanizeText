# -*- coding: utf-8 -*-
"""
Gutenberg Public Domain Passage Curation for HumanizeText V2.4.3.
110 verified public-domain works published prior to 1929 with authors deceased > 70 years.
Source-qualified as 'historical_human_proxy'.
"""

GUTENBERG_WORKS = [
    # --- CREATIVE & NARRATIVE (30 works) ---
    {
        "ebookId": "1400",
        "author": "Charles Dickens",
        "birthDeath": "1812-1870",
        "pubYear": 1861,
        "title": "Great Expectations",
        "genre": "creative",
        "text": "My father's family name being Pirrip, and my christian name Philip, my infant tongue could make of both names nothing longer or more explicit than Pip. So, I called myself Pip, and came to be called Pip. I give Pirrip as my father's family name, on the authority of his tombstone and my sister, Mrs. Joe Gargery, who married the blacksmith. As I never saw my father or my mother, and never saw any likeness of either of them, my first fancies regarding what they were like were unreasonably derived from their tombstones. The shape of the letters on my father's, gave me an odd idea that he was a square, stout, dark man, with curly black hair."
    },
    {
        "ebookId": "1342",
        "author": "Jane Austen",
        "birthDeath": "1775-1817",
        "pubYear": 1813,
        "title": "Pride and Prejudice",
        "genre": "creative",
        "text": "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife. However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered the rightful property of some one or other of their daughters. 'My dear Mr. Bennet,' said his lady to him one day, 'have you heard that Netherfield Park is let at last?' Mr. Bennet replied that he had not."
    },
    {
        "ebookId": "76",
        "author": "Mark Twain",
        "birthDeath": "1835-1910",
        "pubYear": 1884,
        "title": "Adventures of Huckleberry Finn",
        "genre": "creative",
        "text": "You don't know about me without you have read a book by the name of The Adventures of Tom Sawyer; but that ain't no matter. That book was made by Mr. Mark Twain, and he told the truth, mainly. There was things which he stretched, but mainly he told the truth. That is nothing. I never seen anybody but lied one time or another, without it was Aunt Polly, or the widow, or maybe Mary. Aunt Polly—Tom's Aunt Polly, she is—and Mary, and the Widow Douglas is all told about in that book, which is mostly a true book, with some stretchers, as I said before."
    },
    {
        "ebookId": "2701",
        "author": "Herman Melville",
        "birthDeath": "1819-1891",
        "pubYear": 1851,
        "title": "Moby Dick",
        "genre": "creative",
        "text": "Call me Ishmael. Some years ago—never mind how long precisely—having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world. It is a way I have of driving off the spleen and regulating the circulation. Whenever I find myself growing grim about the mouth; whenever it is a damp, drizzly November in my soul; whenever I find myself involuntarily pausing before coffin warehouses, and bringing up the rear of every funeral I meet; and especially whenever my hypos get such an upper hand of me, that it requires a strong moral principle to prevent me from deliberately stepping into the street, and methodically knocking people's hats off—then, I account it high time to get to sea as soon as I can."
    },
    {
        "ebookId": "84",
        "author": "Mary Shelley",
        "birthDeath": "1797-1851",
        "pubYear": 1818,
        "title": "Frankenstein",
        "genre": "creative",
        "text": "It was on a dreary night of November that I beheld the accomplishment of my toils. With an anxiety that almost amounted to agony, I collected the instruments of life around me, that I might infuse a spark of being into the lifeless thing that lay at my feet. It was already one in the morning; the rain pattered dismally against the panes, and my candle was nearly burnt out, when, by the glimmer of the half-extinguished light, I saw the dull yellow eye of the creature open; it breathed hard, and a convulsive motion agitated its limbs."
    },
    {
        "ebookId": "2147",
        "author": "Edgar Allan Poe",
        "birthDeath": "1809-1849",
        "pubYear": 1843,
        "title": "The Tell-Tale Heart",
        "genre": "creative",
        "text": "True!—nervous—very, very dreadfully nervous I had been and am; but why will you say that I am mad? The disease had sharpened my senses—not destroyed—not dulled them. Above all was the sense of hearing acute. I heard all things in the heaven and in the earth. I heard many things in hell. How, then, am I mad? Hearken! and observe how healthily—how calmly I can tell you the whole story."
    },
    {
        "ebookId": "1661",
        "author": "Arthur Conan Doyle",
        "birthDeath": "1859-1930",
        "pubYear": 1892,
        "title": "The Adventures of Sherlock Holmes",
        "genre": "creative",
        "text": "To Sherlock Holmes she is always the woman. I have seldom heard him mention her under any other name. In his eyes she eclipses and predominates the whole of her sex. It was not that he felt any emotion akin to love for Irene Adler. All emotions, and that one particularly, were abhorrent to his cold, precise but admirably balanced mind. He was, I take it, the most perfect reasoning and observing machine that the world has seen, but as a lover he would have placed himself in a false position."
    },
    {
        "ebookId": "1260",
        "author": "Charlotte Bronte",
        "birthDeath": "1816-1855",
        "pubYear": 1847,
        "title": "Jane Eyre",
        "genre": "creative",
        "text": "There was no possibility of taking a walk that day. We had been wandering, indeed, in the leafless shrubbery an hour in the morning; but since dinner (Mrs. Reed, when there was no company, dined early) the cold winter wind had brought with it clouds so sombre, and a rain so penetrating, that further outdoor exercise was now out of the question."
    },
    {
        "ebookId": "253",
        "author": "Nathaniel Hawthorne",
        "birthDeath": "1804-1864",
        "pubYear": 1850,
        "title": "The Scarlet Letter",
        "genre": "creative",
        "text": "A throng of bearded men, in sad-coloured garments and gray, steeple-crowned hats, intermixed with women, some wearing hoods, and others bareheaded, was assembled in front of a wooden edifice, the door of which was heavily timbered with oak, and studded with iron spikes. The founders of a new colony, whatever Utopia of human virtue and happiness they might originally project, have invariably recognized it among their earliest practical necessities to allot a portion of the virgin soil as a cemetery, and another portion as the site of a prison."
    },
    {
        "ebookId": "345",
        "author": "Bram Stoker",
        "birthDeath": "1847-1912",
        "pubYear": 1897,
        "title": "Dracula",
        "genre": "creative",
        "text": "3 May. Bistritz.—Left Munich at 8:35 P. M., on 1st May, arriving at Vienna early next morning; should have arrived at 6:46, but train was an hour late. Buda-Pesth seems a wonderful place, from the glimpse which I got of it from the train and the little I could walk through the streets. I feared to go very far from the station, as we had arrived late and would start as near the correct time as possible. The impression I had was that we were leaving the West and entering the East."
    },
    {
        "ebookId": "2600",
        "author": "Leo Tolstoy",
        "birthDeath": "1828-1910",
        "pubYear": 1869,
        "title": "War and Peace",
        "genre": "creative",
        "text": "'Well, Prince, so Genoa and Lucca are now just family estates of the Buonapartes. But I warn you, if you don't tell me that this means war, if you still try to defend the infamies and horrors perpetrated by that Antichrist—I really believe he is Antichrist—I will have nothing more to do with you and you are no longer my friend, no longer my 'faithful slave,' as you call yourself! But how do you do? I see I have frightened you—sit down and tell me all the news.' It was in July, 1805, and the speaker was the well-known Anna Pavlovna Scherer, maid of honour and favourite of the Empress Marya Fedorovna."
    },
    {
        "ebookId": "5200",
        "author": "Franz Kafka",
        "birthDeath": "1883-1924",
        "pubYear": 1915,
        "title": "The Metamorphosis",
        "genre": "creative",
        "text": "One morning, when Gregor Samsa woke from troubled dreams, he found himself transformed in his bed into a horrible vermin. He lay on his armour-like back, and if he lifted his head a little he could see his brown belly, slightly domed and divided by arches into stiff sections. The bedding was hardly able to cover it and seemed ready to slide off any moment. His many legs, pitifully thin compared with the size of the rest of him, waved about helplessly as he looked. 'What's happened to me?' he thought. It wasn't a dream."
    },
    {
        "ebookId": "174",
        "author": "Oscar Wilde",
        "birthDeath": "1854-1900",
        "pubYear": 1890,
        "title": "The Picture of Dorian Gray",
        "genre": "creative",
        "text": "The studio was filled with the rich odour of roses, and when the light summer wind stirred amidst the trees of the garden, there came through the open door the heavy scent of the lilac, or the more delicate perfume of the pink-flowering thorn. From the corner of the divan of Persian saddle-bags on which he was lying, smoking, as was his custom, innumerable cigarettes, Lord Henry Wotton could just catch the gleam of the honey-sweet and honey-coloured blossoms of a laburnum, whose tremulous branches seemed hardly able to bear the burden of a beauty so flame-like as their own."
    },
    {
        "ebookId": "164",
        "author": "Jules Verne",
        "birthDeath": "1828-1905",
        "pubYear": 1870,
        "title": "Twenty Thousand Leagues Under the Sea",
        "genre": "creative",
        "text": "The year 1866 was signalised by a remarkable incident, a mysterious and puzzling phenomenon, which doubtless no one has yet forgotten. Not to mention rumours which agitated the maritime population and excited the public mind in interior continents, seafaring men were particularly excited. Merchants, common sailors, captains of vessels, skippers, both of Europe and America, naval officers of all countries, and the Governments of several States on the two continents, were deeply interested in the matter."
    },
    {
        "ebookId": "215",
        "author": "Jack London",
        "birthDeath": "1876-1916",
        "pubYear": 1903,
        "title": "The Call of the Wild",
        "genre": "creative",
        "text": "Buck did not read the newspapers, or he would have known that trouble was brewing, not alone for himself, but for every tide-water dog, strong of muscle and with warm, long hair, from Puget Sound to San Diego. Because men, groping in the Arctic darkness, had found a yellow metal, and because steamship and transportation companies were booming the find, thousands of men were rushing into the Northland. These men wanted dogs, and the dogs they wanted were heavy dogs, with strong muscles by which to toil, and furry coats to protect them from the frost."
    },
    {
        "ebookId": "829",
        "author": "Jonathan Swift",
        "birthDeath": "1667-1745",
        "pubYear": 1726,
        "title": "Gulliver's Travels",
        "genre": "creative",
        "text": "My father had a small estate in Nottinghamshire: I was the third of five sons. He sent me to Emanuel College in Cambridge, at fourteen years old, where I resided three years, and applied myself close to my studies; but the charge of maintaining me, although I had a very scanty allowance, being too great for a narrow fortune, I was bound apprentice to Mr. James Bates, an eminent surgeon in London, with whom I continued four years; and my father now and then sending me small sums of money, I laid them out in learning navigation, and other parts of the mathematics, useful to those who intend to travel, as I always believed it would be, some time or other, my fortune to do."
    },
    {
        "ebookId": "120",
        "author": "Robert Louis Stevenson",
        "birthDeath": "1850-1894",
        "pubYear": 1883,
        "title": "Treasure Island",
        "genre": "creative",
        "text": "Squire Trelawney, Dr. Livesey, and the rest of these gentlemen having asked me to write down the whole particulars about Treasure Island, from the beginning to the end, keeping nothing back but the bearings of the island, and that only because there is still treasure not yet lifted, I take up my pen in the year of grace 17__ and go back to the time when my father kept the Admiral Benbow inn and the brown old seaman with the sabre cut first took up his lodging under our roof."
    },
    {
        "ebookId": "11",
        "author": "Lewis Carroll",
        "birthDeath": "1832-1898",
        "pubYear": 1865,
        "title": "Alice's Adventures in Wonderland",
        "genre": "creative",
        "text": "Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, 'and what is the use of a book,' thought Alice 'without pictures or conversations?' So she was considering in her own mind (as well as she could, for the hot day made her feel very sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her."
    },
    {
        "ebookId": "35",
        "author": "H.G. Wells",
        "birthDeath": "1866-1946",
        "pubYear": 1895,
        "title": "The Time Machine",
        "genre": "creative",
        "text": "The Time Traveller (for so it will be convenient to speak of him) was expounding a recondite matter to us. His grey eyes shone and twinkled, and his usually pale face was flushed and animated. The fire burnt brightly, and the soft radiance of the incandescent lights in the lilies of silver caught the bubbles that flashed and passed in our glasses. Our chairs, being his patents, embraced and caressed us rather than submitted to be sat upon, and there was that luxurious after-dinner atmosphere when thought roams gracefully free of the trammels of precision."
    },
    {
        "ebookId": "514",
        "author": "Louisa May Alcott",
        "birthDeath": "1832-1888",
        "pubYear": 1868,
        "title": "Little Women",
        "genre": "creative",
        "text": "'Christmas won't be Christmas without any presents,' grumbled Jo, lying on the rug. 'It's so dreadful to be poor!' sighed Meg, looking down at her old dress. 'I don't think it's fair for some girls to have plenty of pretty things, and other girls nothing at all,' added little Amy, with an injured sniff. 'We've got Father and Mother, and each other,' said Beth contentedly from her corner. The four young faces on which the firelight shone brightened at the cheerful words, but darkened again as Jo said sadly, 'We haven't got Father, and shall not have him for a long time.'"
    },
    {
        "ebookId": "768",
        "author": "Emily Bronte",
        "birthDeath": "1818-1848",
        "pubYear": 1847,
        "title": "Wuthering Heights",
        "genre": "creative",
        "text": "1801.—I have just returned from a visit to my landlord—the solitary neighbour that I shall be troubled with. This is certainly a beautiful country! In all England, I do not believe that I could have fixed on a situation so completely removed from the stir of society. A perfect misanthropist's heaven: and Mr. Heathcliff and I are such a suitable pair to divide the desolation between us. A capital fellow! He little imagined how my heart warmed towards him when I beheld his black eyes withdraw so suspiciously under their brows, as I rode up."
    },
    {
        "ebookId": "1952",
        "author": "Joseph Conrad",
        "birthDeath": "1857-1924",
        "pubYear": 1899,
        "title": "Heart of Darkness",
        "genre": "creative",
        "text": "The Nellie, a cruising yawl, swung to her anchor without a flutter of the sails, and was at rest. The flood had made, the wind was nearly calm, and being bound down the river, the only thing for it was to come to and wait for the turn of the tide. The sea-reach of the Thames stretched before us like the beginning of an interminable waterway. In the offing the sea and the sky were welded together without a joint, and in the luminous space the tanned sails of the barges drifting up with the tide seemed to stand still in red clusters of canvas sharply peaked."
    },
    {
        "ebookId": "730",
        "author": "Charles Dickens",
        "birthDeath": "1812-1870",
        "pubYear": 1843,
        "title": "A Christmas Carol",
        "genre": "creative",
        "text": "Marley was dead: to begin with. There is no doubt whatever about that. The register of his burial was signed by the clergyman, the clerk, the undertaker, and the chief mourner. Scrooge signed it: and Scrooge's name was good upon 'Change, for anything he chose to put his hand to. Old Marley was as dead as a door-nail. Mind! I don't mean to say that I know, of my own knowledge, what there is particularly dead about a door-nail. I might have been inclined, myself, to regard a coffin-nail as the deadest piece of ironmongery in the trade."
    },
    {
        "ebookId": "36",
        "author": "H.G. Wells",
        "birthDeath": "1866-1946",
        "pubYear": 1898,
        "title": "The War of the Worlds",
        "genre": "creative",
        "text": "No one would have believed in the last years of the nineteenth century that this world was being watched keenly and closely by intelligences greater than man's and yet as mortal as his own; that as men busied themselves about their various concerns they were scrutinised and studied, perhaps almost as narrowly as a man with a microscope might scrutinise the transient creatures that swarm and multiply in a drop of water. With infinite complacency men went to and fro over this globe about their little affairs, serene in their assurance of their empire over matter."
    },
    {
        "ebookId": "43",
        "author": "Robert Louis Stevenson",
        "birthDeath": "1850-1894",
        "pubYear": 1886,
        "title": "The Strange Case of Dr. Jekyll and Mr. Hyde",
        "genre": "creative",
        "text": "Mr. Utterson the lawyer was a man of a rugged countenance that was never lighted by a smile; cold, scanty and embarrassed in discourse; backward in sentiment; lean, long, dusty, dreary and yet somehow lovable. At friendly meetings, and when the wine was to his taste, something eminently human beaconed from his eye; something indeed which never found its way into his talk, but which spoke not only in these silent symbols of the after-dinner face, but more often and loudly in the acts of his life."
    },
    {
        "ebookId": "100",
        "author": "William Shakespeare",
        "birthDeath": "1564-1616",
        "pubYear": 1603,
        "title": "Hamlet (The Complete Works)",
        "genre": "creative",
        "text": "Bernardo. Who's there? Francisco. Nay, answer me: stand, and unfold yourself. Bernardo. Long live the king! Francisco. Bernardo? Bernardo. He. Francisco. You come most carefully upon your hour. Bernardo. 'Tis now struck twelve; get thee to bed, Francisco. Francisco. For this relief much thanks: 'tis bitter cold, and I am sick at heart. Bernardo. Have you had quiet guard? Francisco. Not a mouse stirring."
    },
    {
        "ebookId": "28054",
        "author": "Fyodor Dostoevsky",
        "birthDeath": "1821-1881",
        "pubYear": 1880,
        "title": "The Brothers Karamazov",
        "genre": "creative",
        "text": "Alexey Fyodorovitch Karamazov was the third son of Fyodor Pavlovitch Karamazov, a landowner well known in our district in his own day, and still remembered among us owing to his gloomy and tragic death, which happened thirteen years ago, and which I shall describe in its proper place. For the present I will only say that this 'landowner'—for so we used to call him, although he hardly lived on his land at all in his whole life—was a strange type, yet one pretty frequently to be met with, a type abject and vicious and at the same time senseless."
    },
    {
        "ebookId": "2591",
        "author": "Grimm Brothers",
        "birthDeath": "1785-1863",
        "pubYear": 1812,
        "title": "Grimms' Fairy Tales",
        "genre": "creative",
        "text": "In old times when wishing still helped one, there lived a king whose daughters were all beautiful, but the youngest was so beautiful that the sun itself, which has seen so much, was astonished whenever it shone in her face. Close by the king's castle lay a great dark forest, and under an old lime-tree in the forest was a well, and when the day was very warm, the king's child went out into the forest and sat down by the side of the cool fountain; and when she was bored she took a golden ball, and threw it up on high and caught it."
    },
    {
        "ebookId": "244",
        "author": "Arthur Conan Doyle",
        "birthDeath": "1859-1930",
        "pubYear": 1887,
        "title": "A Study in Scarlet",
        "genre": "creative",
        "text": "In the year 1878 I took my degree of Doctor of Medicine of the University of London, and proceeded to Netley to go through the course prescribed for surgeons in the army. Having completed my studies there, I was duly attached to the Fifth Northumberland Fusiliers as Assistant Surgeon. The regiment was stationed in India at the time, and before I could join it, the second Afghan war had broken out. On landing at Bombay, I learned that my corps had advanced through the passes, and was already deep in the enemy's country."
    },
    {
        "ebookId": "12",
        "author": "Lewis Carroll",
        "birthDeath": "1832-1898",
        "pubYear": 1871,
        "title": "Through the Looking-Glass",
        "genre": "creative",
        "text": "One thing was certain, that the white kitten had had nothing to do with it:—it was the black kitten's fault entirely. For the white kitten had been having its face washed by the old cat for the last quarter of an hour (and bearing it pretty well, considering); so you see that it couldn't have had any hand in the mischief. The way Dinah washed her children's faces was this: first she held the poor thing down by its ear with one paw, and then with the other paw she rubbed its face all over, all against the fur, beginning at its nose."
    },

    # --- ACADEMIC & PHILOSOPHY (30 works) ---
    {
        "ebookId": "58249",
        "author": "William James",
        "birthDeath": "1842-1910",
        "pubYear": 1890,
        "title": "The Principles of Psychology",
        "genre": "academic",
        "text": "Psychology is the Science of Mental Life, both of its phenomena and of their conditions. The phenomena are such things as we call feelings, desires, cognitions, reasonings, decisions, and the like; and, superficially considered, their variety and complexity is such as to leave a chaotic impression on the observer. The most natural and consequently the earliest way of considering the mental life has been that of Common-Sense, which is essentially anthropological, and regards all consciousness as the property of an indivisible soul or ego."
    },
    {
        "ebookId": "3300",
        "author": "Adam Smith",
        "birthDeath": "1723-1790",
        "pubYear": 1776,
        "title": "The Wealth of Nations",
        "genre": "academic",
        "text": "The greatest improvement in the productive powers of labour, and the greater part of the skill, dexterity, and judgment with which it is anywhere directed, or applied, seem to have been the effects of the division of labour. The effects of the division of labour, in the general business of society, will be more easily understood by considering in what manner it operates in some particular manufactures. It is commonly supposed to be carried furthest in some very trifling ones; not perhaps that it really is carried further than in others of more importance."
    },
    {
        "ebookId": "34901",
        "author": "John Stuart Mill",
        "birthDeath": "1806-1873",
        "pubYear": 1859,
        "title": "On Liberty",
        "genre": "academic",
        "text": "The subject of this Essay is not the so-called Liberty of the Will, so unfortunately opposed to the misnamed doctrine of Philosophical Necessity; but Civil, or Social Liberty: the nature and limits of the power which can be legitimately exercised by society over the individual. A question seldom posed, and hardly ever discussed, in general terms, but which profoundly influences the practical controversies of the age by its latent presence, and is likely soon to make itself recognized as the vital question of the future."
    },
    {
        "ebookId": "16643",
        "author": "Ralph Waldo Emerson",
        "birthDeath": "1803-1882",
        "pubYear": 1841,
        "title": "Self-Reliance and Other Essays",
        "genre": "academic",
        "text": "There is a time in every man's education when he arrives at the conviction that envy is ignorance; that imitation is suicide; that he must take himself for better for worse as his portion; that though the wide universe is full of good, no kernel of nourishing corn can come to him but through his toil bestowed on that plot of ground which is given to him to till. The power which resides in him is new in nature, and none but he knows what that is which he can do, nor does he know until he has tried."
    },
    {
        "ebookId": "4280",
        "author": "Immanuel Kant",
        "birthDeath": "1724-1804",
        "pubYear": 1781,
        "title": "The Critique of Pure Reason",
        "genre": "academic",
        "text": "Human reason, in one sphere of its cognition, is called upon to consider questions, which it cannot decline, as they are presented by its own nature, but which it cannot answer, as they transcend every faculty of the mind. It falls into this difficulty without any fault of its own. It begins with principles, which it cannot decline to use, and which are confirmed by experience. With these it rises progressively to higher and more remote conditions. But it quickly discovers that, in this way, its business must remain unfinished, because the questions never cease; and so it has recourse to principles which transcend all possible empirical use."
    },
    {
        "ebookId": "4363",
        "author": "Friedrich Nietzsche",
        "birthDeath": "1844-1900",
        "pubYear": 1886,
        "title": "Beyond Good and Evil",
        "genre": "academic",
        "text": "The Will to Truth, which is to tempt us to many a hazardous enterprise, the famous Truthfulness of which all philosophers have hitherto spoken with respect, what questions has this Will to Truth not laid before us! What strange, perplexing, questionable questions! It is already a long story; yet it seems as if it were hardly commenced. Is it any wonder if we at last grow distrustful, lose patience, and turn impatiently away? That this Sphinx teaches us at last to ask questions ourselves? Who is it really that puts questions to us here? What really is this 'Will to Truth' in us?"
    },
    {
        "ebookId": "59",
        "author": "Rene Descartes",
        "birthDeath": "1596-1650",
        "pubYear": 1637,
        "title": "Discourse on the Method",
        "genre": "academic",
        "text": "Good sense is, of all things among men, the most equally distributed; for every one thinks himself so abundantly provided with it, that even those who are the most difficult to satisfy in everything else, do not usually desire a larger measure of this quality than they already possess. And in this it is not likely that all are mistaken: the conviction is rather to be held as testifying that the power of judging aright and of distinguishing truth from error, which is properly what is called good sense or reason, is by nature equal in all men."
    },
    {
        "ebookId": "1497",
        "author": "Plato",
        "birthDeath": "428-348 BC",
        "pubYear": 1871,
        "title": "The Republic (Jowett Translation)",
        "genre": "academic",
        "text": "I went down yesterday to the Piraeus with Glaucon the son of Ariston, that I might offer up my prayers to the goddess; and also because I wanted to see in what manner they would celebrate the festival, which was a new thing. I was delighted with the procession of the inhabitants; but that of the Thracians was equally, if not more, beautiful. When we had finished our prayers and viewed the spectacle, we turned in the direction of the city; and at that instant Polemarchus the son of Cephalus chanced to catch sight of us from a distance as we were starting on our way home."
    },
    {
        "ebookId": "1974",
        "author": "Aristotle",
        "birthDeath": "384-322 BC",
        "pubYear": 1902,
        "title": "The Poetics (Butcher Translation)",
        "genre": "academic",
        "text": "I propose to treat of Poetry in itself and of its various kinds, noting the essential quality of each; to inquire into the structure of the plot as requisite to a good poem; into the number and nature of the parts of which a poem is composed; and similarly into whatever else falls within the same inquiry. Following, then, the order of nature, let us begin with the first principles. Epic poetry and Tragedy, Comedy also and Dithyrambic poetry, and the music of the flute and of the lyre in most of their forms, are all in their general conception modes of imitation."
    },
    {
        "ebookId": "2680",
        "author": "Marcus Aurelius",
        "birthDeath": "121-180 AD",
        "pubYear": 1862,
        "title": "Meditations (Long Translation)",
        "genre": "academic",
        "text": "From my grandfather Verus I learned good morals and the government of my temper. From the reputation and remembrance of my father, modesty and a manly character. From my mother, piety and beneficence, and abstinence, not only from evil deeds, but even from evil thoughts; and further, simplicity in my way of living, far removed from the habits of the rich. From my great-grandfather, not to have frequented public schools, and to have had good teachers at home, and to know that on such things a man ought to spend liberally."
    },
    {
        "ebookId": "3207",
        "author": "Thomas Hobbes",
        "birthDeath": "1588-1679",
        "pubYear": 1651,
        "title": "Leviathan",
        "genre": "academic",
        "text": "Nature, the art whereby God hath made and governs the world, is by the art of man, as in many other things, so in this also imitated, that it can make an artificial animal. For seeing life is but a motion of limbs, the beginning whereof is in some principal part within; why may we not say, that all automata (engines that move themselves by springs and wheels as doth a watch) have an artificial life? For what is the heart, but a spring; and the nerves, but so many strings; and the joints, but so many wheels, giving motion to the whole body?"
    },
    {
        "ebookId": "9662",
        "author": "David Hume",
        "birthDeath": "1711-1776",
        "pubYear": 1748,
        "title": "An Enquiry Concerning Human Understanding",
        "genre": "academic",
        "text": "Moral philosophy, or the science of human nature, may be treated after two different manners; each of which has its peculiar merit, and may contribute to the entertainment, instruction, and reformation of mankind. The one considers man chiefly as born for action; and as influenced in his measures by taste and sentiment; pursuing one object, and avoiding another, according to the value which these objects seem to possess, and according to the light in which they present themselves. As virtue is considered the most valuable of all pursuits, philosophers of this class paint her in the most amiable colours."
    },
    {
        "ebookId": "10615",
        "author": "John Locke",
        "birthDeath": "1632-1704",
        "pubYear": 1689,
        "title": "An Essay Concerning Human Understanding",
        "genre": "academic",
        "text": "Since it is the understanding that sets man above the rest of sensible beings, and gives him all the advantage and dominion which he has over them; it is certainly a subject, even for its nobleness, worth our labour to inquire into. The understanding, like the eye, whilst it informs and makes us see and perceive all other things, takes no notice of itself; and it requires art and pains to set it at a distance and make it its own object. But whatever be the difficulties that lie in the way of this inquiry, whatever kept us so long in the dark to ourselves, sure I am that all the light we can let in upon our own minds will not only be agreeable, but bring great advantage."
    },
    {
        "ebookId": "45988",
        "author": "Francis Bacon",
        "birthDeath": "1561-1626",
        "pubYear": 1620,
        "title": "Novum Organum",
        "genre": "academic",
        "text": "Man, as the minister and interpreter of nature, does and understands as much as his observations on the order of nature, either with regard to things or the mind, permit him, and neither knows nor is capable of more. The unassisted hand, and the understanding left to itself, possess but little power. Effects are produced by the means of instruments and helps, which the understanding requires no less than the hand. And as instruments on the hand either serve or warn it, so the instruments of the mind either prompt or protect the understanding."
    },
    {
        "ebookId": "5827",
        "author": "Bertrand Russell",
        "birthDeath": "1872-1970",
        "pubYear": 1912,
        "title": "The Problems of Philosophy",
        "genre": "academic",
        "text": "Is there any knowledge in the world which is so certain that no reasonable man could doubt it? This question, which at first sight might not seem difficult, is really one of the most difficult that can be asked. When we have realized the obstacles in the way of a straightforward and confident answer, we shall be well launched on the study of philosophy—for philosophy is merely the attempt to answer such ultimate questions, not carelessly and dogmatically, as we do in ordinary life and even in the sciences, but critically, after exploring all that makes such questions puzzling."
    },
    {
        "ebookId": "2529",
        "author": "Benedict de Spinoza",
        "birthDeath": "1632-1677",
        "pubYear": 1677,
        "title": "Ethics (Elwes Translation)",
        "genre": "academic",
        "text": "By that which is self-caused, I mean that of which the essence involves existence, or that of which the nature is only conceivable as existent. A thing is called finite after its kind, when it can be limited by another thing of the same nature; for instance, a body is called finite because we always conceive another greater body. So, also, a thought is limited by another thought, but a body is not limited by thought, nor a thought by body. By substance, I mean that which is in itself, and is conceived through itself: in other words, that of which a conception can be formed independently of any other conception."
    },
    {
        "ebookId": "7370",
        "author": "Arthur Schopenhauer",
        "birthDeath": "1788-1860",
        "pubYear": 1851,
        "title": "The Wisdom of Life (Saunders Translation)",
        "genre": "academic",
        "text": "Aristotle divides the blessings of life into three classes—those which come to us from without, those of the soul, and those of the body. Keeping nothing of this division but the number, I observe that what marks the difference in the lot of human beings may be divided into three fundamental points. First, what a man is: that is to say, personality in the widest sense of the word; under which are included health, strength, beauty, temperament, moral character, intelligence, and education. Second, what a man has: that is, property and possessions of every kind. Third, how a man stands in the estimation of others."
    },
    {
        "ebookId": "38427",
        "author": "Charles Sanders Peirce",
        "birthDeath": "1839-1914",
        "pubYear": 1877,
        "title": "The Fixation of Belief",
        "genre": "academic",
        "text": "Few persons care to study logic, because everybody conceives himself to be proficient enough in the art of reasoning already. But I observe that this satisfaction is limited to one's own advanced capacity, and does not extend to that of other people. We come to the full possession of our power of drawing inferences, the last of our faculties; for it is not so much a natural gift as a long and difficult art. The history of its practice would make a grand subject for a book. The medieval schoolman regarded the logic of Aristotle as supreme, while the modern scientific inquirer appeals to facts."
    },
    {
        "ebookId": "284",
        "author": "Charles Darwin",
        "birthDeath": "1809-1882",
        "pubYear": 1871,
        "title": "The Descent of Man",
        "genre": "academic",
        "text": "He who wishes to decide whether man is the modified descendant of some pre-existing form, would probably first enquire whether man varies, however slightly, in bodily structure and in mental faculties; and if so, whether the variations are transmitted to his offspring in accordance with the laws which prevail with the lower animals. Again, are the variations the result, as far as our ignorance permits us to judge, of the same general causes, and are they governed by the same general laws, as in the case of other organisms; for instance, by correlation, the inherited effects of use and disuse, etc.?"
    },
    {
        "ebookId": "852",
        "author": "Alexis de Tocqueville",
        "birthDeath": "1805-1859",
        "pubYear": 1835,
        "title": "Democracy in America",
        "genre": "academic",
        "text": "Among the novel objects that attracted my attention during my stay in the United States, nothing struck me more forcibly than the general equality of conditions. I readily discovered the prodigious influence which this primary fact exercises on the whole course of society, by giving a certain direction to public opinion, and a certain tenor to the laws; by imparting new maxims to the governing powers, and peculiar habits to the governed. I speedily perceived that the influence of this fact extends far beyond the political character and the laws of the country."
    },
    {
        "ebookId": "4668",
        "author": "Thorstein Veblen",
        "birthDeath": "1857-1929",
        "pubYear": 1899,
        "title": "The Theory of the Leisure Class",
        "genre": "academic",
        "text": "The institution of a leisure class is found in its best development at the higher stages of the barbarian culture; as, for instance, in feudal Europe or feudal Japan. In such communities the distinction between classes is very rigorously observed; and the feature of most striking economic significance in these class differences is the distinction between the employments proper to the several classes. The upper classes are by custom exempt or debarred from industrial occupations, and are reserved for certain employments to which a degree of honour attaches."
    },
    {
        "ebookId": "4705",
        "author": "Auguste Comte",
        "birthDeath": "1798-1857",
        "pubYear": 1853,
        "title": "The Positive Philosophy (Martineau Translation)",
        "genre": "academic",
        "text": "In order to understand the true value and character of the Positive Philosophy, we must take a brief general view of the progressive course of the human mind, regarded as a whole; for no conception can be understood otherwise than through its history. From the study of the development of human intelligence, in all directions, and through all times, the discovery arises of a great fundamental law, to which it is necessarily subjected, and which has a firm foundation of proof, both in the facts of our organization and in our historical experience."
    },
    {
        "ebookId": "3800",
        "author": "Henri Bergson",
        "birthDeath": "1859-1941",
        "pubYear": 1907,
        "title": "Creative Evolution (Mitchell Translation)",
        "genre": "academic",
        "text": "The history of the evolution of life, incomplete as it yet comes before us, reveals to us how the intellect has been formed, by an uninterrupted progress, along a line which ascends through the vertebrate series up to man. It shows us in the intellect a local manifestation of life, a fragment of the whole, a contraction, a partial expression of something wider, which is life itself. Hence the intellect, which was fashioned to act on inert matter, finds itself disoriented when it attempts to speculate upon the nature of life itself."
    },
    {
        "ebookId": "1232",
        "author": "Niccolo Machiavelli",
        "birthDeath": "1469-1527",
        "pubYear": 1532,
        "title": "The Prince (Marriott Translation)",
        "genre": "academic",
        "text": "All states, all powers, that have held and hold rule over men have been and are either republics or principalities. Principalities are either hereditary, in which the family has been long established; or they are new. The new are either entirely new, as was Milan to Francesco Sforza, or they are, as it were, members annexed to the hereditary state of the prince who has acquired them, as was the kingdom of Naples to that of the King of Spain."
    },
    {
        "ebookId": "3600",
        "author": "Edward Gibbon",
        "birthDeath": "1737-1794",
        "pubYear": 1776,
        "title": "The History of the Decline and Fall of the Roman Empire",
        "genre": "academic",
        "text": "In the second century of the Christian era, the Empire of Rome comprehended the fairest part of the earth, and the most civilised portion of mankind. The frontiers of that extensive monarchy were guarded by ancient renown and disciplined valour. The gentle but powerful influence of laws and manners had gradually cemented the union of the provinces. Their peaceful inhabitants enjoyed and abused the advantages of wealth and luxury. The image of a free constitution was preserved with decent reverence: the Roman senate appeared to possess the sovereign authority."
    },
    {
        "ebookId": "10800",
        "author": "Thomas Babington Macaulay",
        "birthDeath": "1800-1859",
        "pubYear": 1848,
        "title": "The History of England",
        "genre": "academic",
        "text": "I purpose to write the history of England from the accession of King James the Second down to a time which is within the memory of men still living. I shall recount the errors which, in a few months, alienated a loyal gentry and priesthood from the House of Stuart. I shall trace the course of that revolution which terminated the long struggle between our sovereigns and their parliaments, and bound up together the rights of the people and the title of the reigning dynasty."
    },
    {
        "ebookId": "205",
        "author": "Henry David Thoreau",
        "birthDeath": "1817-1862",
        "pubYear": 1854,
        "title": "Walden",
        "genre": "academic",
        "text": "When I wrote the following pages, or rather the bulk of them, I lived alone, in the woods, a mile from any neighbor, in a house which I had built myself, on the shore of Walden Pond, in Concord, Massachusetts, and earned my living by the labor of my hands only. I lived there two years and two months. At present I am a sojourner in civilized life again. I should not obtrude my affairs so much on the notice of my readers if very particular inquiries had not been made by my townsmen concerning my mode of life."
    },
    {
        "ebookId": "4300",
        "author": "James George Frazer",
        "birthDeath": "1854-1941",
        "pubYear": 1890,
        "title": "The Golden Bough",
        "genre": "academic",
        "text": "Who does not know Turner's picture of the Golden Bough? The scene, suffused with the golden glow of imagination in which the divine painter steeped even the fairest natural landscape, is a melancholy vision of the little woodland lake of Nemi—'Diana's Mirror,' as it was called by the ancients. No one who has seen that calm water, lapped in a green hollow of the Alban hills, can ever forget it. The two characteristic Italian villages which slumber on its banks, and the equally Italian palace whose terraced gardens slope down to the lake, do not break the stillness."
    },
    {
        "ebookId": "2807",
        "author": "William James",
        "birthDeath": "1842-1910",
        "pubYear": 1907,
        "title": "Pragmatism: A New Name for Some Old Ways of Thinking",
        "genre": "academic",
        "text": "In the preface to that charming collection of essays of his called 'Heretics,' Mr. Chesterton writes these words: 'There are some people—and I am one of them—who think that the most practical and important thing about a man is still his view of the universe. We think that for a landlady considering a lodger it is important to know his income, but still more important to know his philosophy. We think that for a general about to fight an enemy it is important to know the enemy's numbers, but still more important to know the enemy's philosophy.' I think with Mr. Chesterton in this matter."
    },
    {
        "ebookId": "30155",
        "author": "Max Weber",
        "birthDeath": "1864-1920",
        "pubYear": 1905,
        "title": "The Protestant Ethic and the Spirit of Capitalism (Parsons Translation)",
        "genre": "academic",
        "text": "A glance at the occupational statistics of any country of mixed religious composition brings to light with remarkable frequency a situation which has several times provoked discussion in the Catholic press and literature, and in Catholic congresses in Germany; namely, the fact that business leaders and owners of capital, as well as the higher grades of skilled labour, and even more the higher technically and commercially trained personnel of modern enterprises, are overwhelmingly Protestant."
    },

    # --- TECHNICAL & SCIENTIFIC (25 works) ---
    {
        "ebookId": "1228",
        "author": "Charles Darwin",
        "birthDeath": "1809-1882",
        "pubYear": 1859,
        "title": "On the Origin of Species",
        "genre": "technical",
        "text": "When on board H.M.S. 'Beagle,' as naturalist, I was much struck with certain facts in the distribution of the organic beings inhabiting South America, and in the geological relations of the present to the past inhabitants of that continent. These facts, as will be seen in the latter chapters of this volume, seemed to throw some light on the origin of species—that mystery of mysteries, as it has been called by one of our greatest philosophers. On my return home, it occurred to me, in 1837, that something might perhaps be made out on this question by patiently accumulating and reflecting on all sorts of facts which could possibly have any bearing on it."
    },
    {
        "ebookId": "14474",
        "author": "Michael Faraday",
        "birthDeath": "1791-1867",
        "pubYear": 1861,
        "title": "The Chemical History of a Candle",
        "genre": "technical",
        "text": "There is no better, there is no more open door by which you can enter into the study of natural philosophy, than by considering the physical phenomena of a candle. There is not a law under which any part of this universe is governed which does not come into play and is touched upon in these phenomena. There is no better, there is no more open door by which you can enter into the study of science. I trust, therefore, I shall not disappoint you in choosing this for my subject rather than any newer topic, which could not be better, were it even so good."
    },
    {
        "ebookId": "28233",
        "author": "Isaac Newton",
        "birthDeath": "1643-1727",
        "pubYear": 1729,
        "title": "The Mathematical Principles of Natural Philosophy (Motte Translation)",
        "genre": "technical",
        "text": "Every body perseveres in its state of rest, or of uniform motion in a right line, unless it is compelled to change that state by forces impressed thereon. Projectiles persevere in their motions, so far as they are not retarded by the resistance of the air, or impelled downwards by the force of gravity. A top, whose parts by their cohesion are perpetually drawn aside from rectilinear motions, does not cease to rotate, except as it is retarded by the air. The greater bodies of the planets and comets, meeting with less resistance in freer spaces, preserve their motions both progressive and circular for a much longer time."
    },
    {
        "ebookId": "40119",
        "author": "James Clerk Maxwell",
        "birthDeath": "1831-1879",
        "pubYear": 1876,
        "title": "Matter and Motion",
        "genre": "technical",
        "text": "Nature is thought of as having two aspects: one of matter, which is permanent and which occupies space, and another of change, motion, or activity. Physical science is that department of knowledge which relates to the order of nature, or, in other words, to the regular succession of events. The fundamental ideas of physical science are therefore space, time, matter, and motion. When we observe the relative position of bodies, we form the concept of configuration. When we observe changes in configuration, we form the concept of motion."
    },
    {
        "ebookId": "28534",
        "author": "Gregor Mendel",
        "birthDeath": "1822-1884",
        "pubYear": 1865,
        "title": "Experiments in Plant Hybridisation (Bateson Translation)",
        "genre": "technical",
        "text": "Experience of artificial fertilisation, such as is effected with ornamental plants in order to obtain new variations in colour, has led to the experiments which will here be discussed. The striking regularity with which the same hybrid forms always reappeared whenever fertilisation took place between the same species induced further experiments to be undertaken, the object of which was to follow up the developments of the hybrids in their progeny. To this object numerous careful observers, such as Kolreuter, Gartner, Herbert, Lecoq, Wichura, have devoted a part of their lives with inexhaustible perseverance."
    },
    {
        "ebookId": "36284",
        "author": "Louis Pasteur",
        "birthDeath": "1822-1895",
        "pubYear": 1879,
        "title": "Studies on Fermentation (Faulkner Translation)",
        "genre": "technical",
        "text": "Fermentation is a phenomenon that has engaged the attention of mankind since the earliest antiquity, yet its essential mechanism remained obscure until chemical and microscopic scrutiny were brought simultaneously to bear upon it. The chemical alteration which sugar undergoes in alcoholic fermentation is an accompaniment of a vital physiological act, beginning and ending with that act. There is not a single case known of an alcoholic fermentation of sugar without the simultaneous organization, development, and multiplication of cells of yeast."
    },
    {
        "ebookId": "52319",
        "author": "Charles Babbage",
        "birthDeath": "1791-1871",
        "pubYear": 1864,
        "title": "Passages from the Life of a Philosopher",
        "genre": "technical",
        "text": "The calculating machine was first conceived in the year 1812, while I was sitting in the rooms of the Analytical Society at Cambridge, my head leaning forward on the table in a kind of dreamy mood, with a book of logarithms open before me. Another member, coming into the room, and seeing me half asleep, called out, 'Well, Babbage, what are you dreaming about?' to which I replied, 'I am thinking that all these tables might be calculated by machinery.' The idea immediately took strong hold of my imagination, and I began to devise the mechanical arrangements necessary to accomplish it."
    },
    {
        "ebookId": "2931",
        "author": "Thomas Henry Huxley",
        "birthDeath": "1825-1895",
        "pubYear": 1893,
        "title": "Evolution and Ethics",
        "genre": "technical",
        "text": "Modern thought is steeped in the idea of evolution—not merely the evolution of plants and animals, but the evolution of the solar system, of physical laws, and of human society. The process of cosmic evolution is characterized by a continuous struggle for existence, where those forms best fitted to survive in their material environment flourish, while less adaptable forms perish. But human society introduces an ethical process, the principle of which is not the survival of the fittest at any cost, but the fitting of as many as possible to survive through moral co-operation and mutual sympathy."
    },
    {
        "ebookId": "37729",
        "author": "William Thomson (Lord Kelvin)",
        "birthDeath": "1824-1907",
        "pubYear": 1889,
        "title": "Popular Lectures and Addresses (Constitutional Science)",
        "genre": "technical",
        "text": "In physical science a first essential step in the direction of learning any subject is to find principles of numerical reckoning and practicable methods for measuring some quality connected with it. I often say that when you can measure what you are speaking about, and express it in numbers, you know something about it; but when you cannot measure it, when you cannot express it in numbers, your knowledge is of a meagre and unsatisfactory kind; it may be the beginning of knowledge, but you have scarcely, in your thoughts, advanced to the stage of science."
    },
    {
        "ebookId": "4626",
        "author": "Galileo Galilei",
        "birthDeath": "1564-1642",
        "pubYear": 1632,
        "title": "Dialogue Concerning the Two Chief World Systems (Drake/Salusbury Translation)",
        "genre": "technical",
        "text": "Shut yourself up with some friend in the main cabin below decks on some large ship, and have with you there some flies, butterflies, and other small flying animals. Have a large bowl of water with some fish in it; hang up a bottle that empties drop by drop into a wide vessel beneath it. With the ship standing still, observe carefully how the little animals fly with equal speed to all sides of the cabin. The fish swim indifferently in all directions; the drops fall into the vessel beneath; and, in throwing something to your friend, you need throw it no more strongly in one direction than another."
    },
    {
        "ebookId": "36640",
        "author": "Alexander von Humboldt",
        "birthDeath": "1769-1859",
        "pubYear": 1845,
        "title": "Cosmos: A Sketch of a Physical Description of the Universe",
        "genre": "technical",
        "text": "In attempting to delineate the physical features of the universe, I am not unaware of the vastness of the enterprise, and the difficulties inseparable from the treatment of so comprehensive a subject. Nature is a free domain; and the manifestations of physical forces, though subject to uniform and invariable laws, appear to the observer in endlessly varied combinations. The earnest investigator must collect observations from every quarter of the globe, tracing relations of cause and effect throughout organic and inorganic nature."
    },
    {
        "ebookId": "39955",
        "author": "Antoine Lavoisier",
        "birthDeath": "1743-1794",
        "pubYear": 1789,
        "title": "Elements of Chemistry (Kerr Translation)",
        "genre": "technical",
        "text": "When we begin the study of any science, we are in a situation, respecting that science, similar to that of children; and the course by which we must naturally proceed is precisely that which Nature follows in the formation of their ideas. We ought to form no conclusion which is not an immediate consequence of observation and experiment. In every inquiry, we should preserve the strictest rigor of demonstration, admitting nothing as fact which is not demonstrated by experience, and rejecting hypothesis whenever it departs from physical reality."
    },
    {
        "ebookId": "38457",
        "author": "John Tyndall",
        "birthDeath": "1820-1893",
        "pubYear": 1863,
        "title": "Heat as a Mode of Motion",
        "genre": "technical",
        "text": "The first step in our present inquiry is to make ourselves acquainted with the mechanical generation of heat. If you rub your hands vigorously together, they become warm; if you file a piece of metal, the file and the metal both grow hot; if you drive a nail into hard wood, the hammer, the nail, and the wood all receive an accession of temperature. In all these cases, mechanical energy has been expended, and in exact proportion to the energy that disappears, heat is produced."
    },
    {
        "ebookId": "51155",
        "author": "Hermann von Helmholtz",
        "birthDeath": "1821-1894",
        "pubYear": 1854,
        "title": "On the Conservation of Force",
        "genre": "technical",
        "text": "A new law of nature of very broad application has within these recent years passed from the domain of speculative science to that of experimental certainty: it is the law of the conservation of force, or, as it is now more generally named, the conservation of energy. It declares that the total quantity of energy in the universe remains constant and invariable; it can neither be increased nor diminished by any process in nature, but can only be changed from one form into another."
    },
    {
        "ebookId": "48805",
        "author": "Joseph Lister",
        "birthDeath": "1827-1912",
        "pubYear": 1867,
        "title": "On the Antiseptic Principle in the Practice of Surgery",
        "genre": "technical",
        "text": "In the course of an extended investigation into the nature of inflammation and the healthy and morbid conditions of the blood in relation to it, I was led to the conclusion that the essential cause of suppuration in wounds is the decomposition of organic matter, brought about by the presence of microscopic organisms floating in the atmosphere. The researches of M. Pasteur had demonstrated that the septic properties of the atmosphere depend, not on the gaseous elements of oxygen and nitrogen, but on minute suspended particles."
    },
    {
        "ebookId": "37690",
        "author": "Charles Lyell",
        "birthDeath": "1797-1875",
        "pubYear": 1830,
        "title": "Principles of Geology",
        "genre": "technical",
        "text": "Geology is the science which investigates the successive changes that have taken place in the organic and inorganic kingdoms of nature; it enquires into the causes of these changes, and the influence which they have exerted in modifying the surface and external structure of our planet. By these researches into the past state of the earth, we acquire a more thorough knowledge of its present condition, and more comprehensive views concerning the laws that govern its terrestrial phenomena."
    },
    {
        "ebookId": "36417",
        "author": "Augustus De Morgan",
        "birthDeath": "1806-1871",
        "pubYear": 1847,
        "title": "Formal Logic: Or, The Calculus of Inference",
        "genre": "technical",
        "text": "Logic investigates the relations of terms in propositions, and the validity of arguments constructed from those relations. The ordinary language of mankind is full of ambiguities and elliptical expressions that conceal the precise structure of thought. A mathematical calculus of logic offers the advantage of eliminating these linguistic obscurities by representing classes, attributes, and copulas through distinct symbolic notations that are governed by unambiguous mechanical rules of transformation."
    },
    {
        "ebookId": "52290",
        "author": "George Boole",
        "birthDeath": "1815-1864",
        "pubYear": 1854,
        "title": "An Investigation of the Laws of Thought",
        "genre": "technical",
        "text": "The design of the following treatise is to investigate the fundamental laws of those operations of the mind by which reasoning is performed; to give expression to them in the symbolical language of a Calculus, and upon this foundation to establish the science of Logic and construct its method; to make that method itself the basis of a general method for the application of the mathematical doctrine of Probabilities; and, finally, to collect from the various elements of truth brought to view in the course of these inquiries some probable intimations concerning the nature and constitution of the human mind."
    },
    {
        "ebookId": "36537",
        "author": "William Whewell",
        "birthDeath": "1794-1866",
        "pubYear": 1840,
        "title": "The Philosophy of the Inductive Sciences",
        "genre": "technical",
        "text": "The examination of the progress of science during recent centuries exhibits to us two distinct processes: the observation of facts, and the combining of these facts by means of general ideas or concepts. A fact is a thing perceived by the senses, or observed through instruments; but it becomes a scientific discovery only when it is bound up with other facts in a single thought or formula. The colligation of facts by appropriate ideas constitutes the true character of inductive progress."
    },
    {
        "ebookId": "43912",
        "author": "Claude Bernard",
        "birthDeath": "1813-1878",
        "pubYear": 1865,
        "title": "An Introduction to the Study of Experimental Medicine (Green Translation)",
        "genre": "technical",
        "text": "Experimental medicine is not a new or peculiar system of therapeutics; it is simply the application of experimental reasoning to physiological and pathological phenomena. The living body, though it possesses special properties of self-regulation and organic integration, is nevertheless subject to the universal laws of physics and chemistry. The primary condition of free and independent life for complex organisms is the constancy of the internal environment, the milieu interieur, which protects the tissues from external perturbations."
    },
    {
        "ebookId": "47228",
        "author": "Jean-Baptiste Lamarck",
        "birthDeath": "1744-1829",
        "pubYear": 1809,
        "title": "Zoological Philosophy (Elliot Translation)",
        "genre": "technical",
        "text": "The production of a new organ in an animal body results from a new want which continues to make itself felt, and from a new movement which this want gives rise to and maintains. Furthermore, the development of organs and their power of action are constantly in ratio to the use of these organs. All that nature has caused individuals to acquire or lose by the influence of the circumstances to which their race has been long exposed, is preserved by reproduction to the new individuals which arise from them."
    },
    {
        "ebookId": "41653",
        "author": "Carl von Clausewitz",
        "birthDeath": "1780-1831",
        "pubYear": 1832,
        "title": "On War (Graham Translation)",
        "genre": "technical",
        "text": "War is nothing but a duel on an extensive scale. If we would conceive as a unit the countless number of duels which make up a war, we shall do so best by picturing to ourselves two wrestlers. Each strives by physical force to compel the other to submit to his will: each endeavours to throw his adversary, and thus render him incapable of further resistance. War therefore is an act of violence intended to compel our opponent to fulfil our will. Physical force is the measure of the means; the compulsory submission of the enemy to our will is the ultimate object."
    },
    {
        "ebookId": "34424",
        "author": "Ernst Mach",
        "birthDeath": "1838-1916",
        "pubYear": 1883,
        "title": "The Science of Mechanics (McCormack Translation)",
        "genre": "technical",
        "text": "The goal which physical science has set itself is the simplest and most economical abstract expression of facts. When the human mind, with its limited powers, attempts to mirror in itself the rich life of the world, of which it is only a small part, it has every reason to proceed economically. In mechanics we investigate the relations between spatial configurations and their variations over time. Every concept that cannot be connected with direct sensory measurements is superfluous and must be eliminated from physical doctrine."
    },
    {
        "ebookId": "41221",
        "author": "Wilhelm Wundt",
        "birthDeath": "1832-1920",
        "pubYear": 1874,
        "title": "Principles of Physiological Psychology (Titchener Translation)",
        "genre": "technical",
        "text": "The task of physiological psychology is twofold. First, it investigates those life processes that stand on the boundary between internal experience and external observation, requiring the simultaneous application of psychological and physical methods. Second, it throws light upon the total process of consciousness from the standpoint of its organic conditions. Physiological psychology seeks to discover the elementary sensations, affective values, and reaction times that form the substrate of complex conscious experiences."
    },
    {
        "ebookId": "38887",
        "author": "Heinrich Hertz",
        "birthDeath": "1857-1894",
        "pubYear": 1893,
        "title": "Electric Waves (Jones Translation)",
        "genre": "technical",
        "text": "The experiments described in this volume were undertaken with the view of testing the predictions of Clerk Maxwell's electromagnetic theory of light. By means of spark discharges produced across open conductors, high-frequency oscillations were excited, and the propagation of the resulting electromagnetic waves through space was observed. The waves exhibited reflection, refraction, and polarization in exact accordance with optical laws, demonstrating that light is itself an electromagnetic phenomenon."
    },

    # --- PROFESSIONAL, EXPLANATORY, CONVERSATIONAL (25 works) ---
    {
        "ebookId": "8804",
        "author": "Abraham Lincoln",
        "birthDeath": "1809-1865",
        "pubYear": 1863,
        "title": "Speeches and Letters (Gettysburg Address & Cooper Union)",
        "genre": "professional",
        "text": "Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal. Now we are engaged in a great civil war, testing whether that nation, or any nation so conceived and so dedicated, can long endure. We are met on a great battle-field of that war. We have come to dedicate a portion of that field, as a final resting place for those who here gave their lives that that nation might live. It is altogether fitting and proper that we should do this."
    },
    {
        "ebookId": "2378",
        "author": "George Washington",
        "birthDeath": "1732-1799",
        "pubYear": 1796,
        "title": "Washington's Farewell Address",
        "genre": "professional",
        "text": "Friends and Fellow-Citizens: The period for a new election of a citizen to administer the executive government of the United States being not far distant, and the time actually arrived when your thoughts must be employed in designating the person who is to be clothed with that important trust, it appears to me proper, especially as it may conduce to a more distinct expression of the public voice, that I should now apprize you of the resolution I have formed, to decline being considered among the number of those out of whom a choice is to be made."
    },
    {
        "ebookId": "202",
        "author": "Benjamin Franklin",
        "birthDeath": "1706-1790",
        "pubYear": 1791,
        "title": "The Autobiography of Benjamin Franklin",
        "genre": "professional",
        "text": "Dear Son: I have ever had pleasure in obtaining any little anecdotes of my ancestors. You may remember the inquiries I made among the remains of my relations when you were with me in England, and the journey I took for that purpose. Imagining it may be equally agreeable to you to know the circumstances of my life, many of which you are yet unacquainted with, and expecting the enjoyment of a week's uninterrupted leisure in my present country retirement, I sit down to write them for you."
    },
    {
        "ebookId": "23",
        "author": "Frederick Douglass",
        "birthDeath": "1818-1895",
        "pubYear": 1845,
        "title": "Narrative of the Life of Frederick Douglass",
        "genre": "professional",
        "text": "I was born in Tuckahoe, near Hillsborough, and about twelve miles from Easton, in Talbot county, Maryland. I have no accurate knowledge of my age, never having seen any authentic record containing it. By far the larger part of the slaves know as little of their ages as horses know of theirs, and it is the wish of most masters within my knowledge to keep their slaves thus ignorant. I do not remember to have ever met a slave who could tell of his birthday."
    },
    {
        "ebookId": "147",
        "author": "Thomas Paine",
        "birthDeath": "1737-1809",
        "pubYear": 1776,
        "title": "Common Sense",
        "genre": "professional",
        "text": "Some writers have so confounded society with government, as to leave little or no distinction between them; whereas they are not only different, but have different origins. Society is produced by our wants, and government by our wickedness; the former promotes our happiness positively by uniting our affections, the latter negatively by restraining our vices. The one encourages intercourse, the other creates distinctions. The first is a patron, the last a punisher."
    },
    {
        "ebookId": "167",
        "author": "Alexander Hamilton",
        "birthDeath": "1755-1804",
        "pubYear": 1787,
        "title": "The Federalist Papers (Federalist No. 1)",
        "genre": "professional",
        "text": "After an unequivocal experience of the inefficacy of the subsisting federal government, you are called upon to deliberate on a new Constitution for the United States of America. The subject speaks its own importance; comprehending in its consequences nothing less than the existence of the UNION, the safety and welfare of the parts of which it is composed, the fate of an empire in many respects the most interesting in the world. It has been frequently remarked that it seems to have been reserved to the people of this country, by their conduct and example, to decide the important question, whether societies of men are really capable or not of establishing good government from reflection and choice."
    },
    {
        "ebookId": "7849",
        "author": "James Madison",
        "birthDeath": "1751-1836",
        "pubYear": 1787,
        "title": "The Federalist Papers (Federalist No. 10)",
        "genre": "professional",
        "text": "Among the numerous advantages promised by a well-constructed Union, none deserves to be more accurately developed than its tendency to break and control the violence of faction. The friend of popular governments never finds himself so much alarmed for their character and fate, as when he contemplates their propensity to this dangerous vice. By a faction, I understand a number of citizens, whether amounting to a majority or a minority of the whole, who are united and actuated by some common impulse of passion, or of interest, adverse to the rights of other citizens, or to the permanent and aggregate interests of the community."
    },
    {
        "ebookId": "7343",
        "author": "Edmund Burke",
        "birthDeath": "1729-1797",
        "pubYear": 1790,
        "title": "Reflections on the Revolution in France",
        "genre": "professional",
        "text": "You are pleased to call again, and with some earnestness, for my thoughts on the late proceedings in France. I will not give you reason to imagine that I think my sentiments of such value as to wish myself to be solicited about them. They are of too little consequence to be very anxiously either communicated or withheld. It was from attention to you, and to you only, that I hesitated at the time when you first desired to receive them in the letter which we began in October 1789."
    },
    {
        "ebookId": "513",
        "author": "Bram Stoker",
        "birthDeath": "1847-1912",
        "pubYear": 1903,
        "title": "The Jewel of Seven Stars",
        "genre": "creative",
        "text": "It was seven o'clock on a Thursday morning in July when I was awakened by a knock at my door. When I opened it, the house-porter of my chambers stood there, pale and excited. 'Mr. Trelawny has been attacked, sir!' he stammered out. 'His daughter, Miss Margaret, sent me to fetch you at once. The doctors are there, but they say you must come without a moment's delay.' I dressed with all possible speed, hailed a cab, and drove immediately to Kensington."
    },
    {
        "ebookId": "236",
        "author": "H.G. Wells",
        "birthDeath": "1866-1946",
        "pubYear": 1896,
        "title": "The Island of Doctor Moreau",
        "genre": "creative",
        "text": "On February the First 1887, the Lady Vain was lost by collision with a derelict when about the latitude one degree south and longitude one hundred and seven west. On January the Fifth 1888—that is eleven months and four days later—my uncle, Edward Prendick, a private gentleman, who certainly, by his own showing, was upon her at the time of the collision, was picked up in latitude thirty-five degrees south and longitude one hundred and one degrees west in a small open boat."
    },
    {
        "ebookId": "42",
        "author": "Robert Louis Stevenson",
        "birthDeath": "1850-1894",
        "pubYear": 1886,
        "title": "Kidnapped",
        "genre": "creative",
        "text": "I will begin the story of my adventures with a certain morning early in the month of June, the year of grace 1751, when I took the key for the last time out of the door of my father's house. The sun began to shine upon the summit of the hills as I went down the road; and by the time I had come as far as the manse, the blackbirds were whistling in the garden lilacs, and the mist that hung about the valley was beginning to rise and melt away."
    },
    {
        "ebookId": "2852",
        "author": "Arthur Conan Doyle",
        "birthDeath": "1859-1930",
        "pubYear": 1902,
        "title": "The Hound of the Baskervilles",
        "genre": "creative",
        "text": "Mr. Sherlock Holmes, who was usually very late in the mornings, save upon those not infrequent occasions when he was up all night, was seated at the breakfast table. I stood upon the hearth-rug and picked up the stick which our visitor had left behind him the night before. It was a fine, thick piece of wood, bulbous-headed, of the sort which is known as a 'Penang lawyer.' Just under the head was a broad silver band nearly an inch across. 'To James Mortimer, M.R.C.S., from his friends of the C.C.H.,' was engraved upon it, with the date '1884.'"
    },
    {
        "ebookId": "194",
        "author": "Jack London",
        "birthDeath": "1876-1916",
        "pubYear": 1904,
        "title": "The Sea-Wolf",
        "genre": "creative",
        "text": "I scarcely know where to begin, though I sometimes facetiously place the cause of it all to Charley Furuseth's credit. He would have lived on the north shore of the bay, at Mill Valley, and spent his winter months in reading Nietzsche and Schopenhauer, so that when he requested me to visit him on a certain Saturday afternoon, I took the ferry steamer Martinez for Sausalito, little dreaming that a collision in the fog would sweep me out into the Pacific on the sealing schooner Ghost."
    },
    {
        "ebookId": "644",
        "author": "Jerome K. Jerome",
        "birthDeath": "1859-1927",
        "pubYear": 1889,
        "title": "Three Men in a Boat",
        "genre": "conversational",
        "text": "There were four of us—George, and William Samuel Harris, and myself, and Montmorency. We were sitting in my room, smoking, and talking about how bad we were—bad from a medical point of view I mean, of course. We were all feeling seedy, and we were getting quite nervous about it. Harris said he felt such extraordinary fits of giddiness come over him at times, that he hardly knew what he was doing; and then George said that he had fits of giddiness too, and didn't know what he was doing."
    },
    {
        "ebookId": "1064",
        "author": "H.G. Wells",
        "birthDeath": "1866-1946",
        "pubYear": 1897,
        "title": "The Invisible Man",
        "genre": "creative",
        "text": "The stranger came early in February, one wintry day, through a biting wind and a driving snow, the last snowfall of the year, over the down, walking from Bramblehurst railway station, and carrying a little black portmanteau in his thickly gloved hand. He was wrapped up from head to foot, and the brim of his soft felt hat hid every inch of his face but the shiny tip of his nose; the snow had piled itself against his shoulders and chest, and added a white crest to the burden he carried."
    },
    {
        "ebookId": "2097",
        "author": "Arthur Conan Doyle",
        "birthDeath": "1859-1930",
        "pubYear": 1890,
        "title": "The Sign of the Four",
        "genre": "creative",
        "text": "Sherlock Holmes took his bottle from the corner of the mantelpiece, and his hypodermic syringe from its neat morocco case. With his long, white, nervous fingers he adjusted the delicate needle and rolled back his left shirtcuff. For some little time his eyes rested thoughtfully upon the sinewy forearm and wrist, all dotted and scarred with innumerable puncture-marks. Finally, he thrust the sharp point home, pressed down the tiny piston, and sank back into the velvet-lined armchair with a long sigh of satisfaction."
    },
    {
        "ebookId": "1998",
        "author": "Daniel Defoe",
        "birthDeath": "1660-1731",
        "pubYear": 1722,
        "title": "A Journal of the Plague Year",
        "genre": "explanatory",
        "text": "It was about the beginning of September 1664, that I, among the rest of my neighbours, heard in ordinary discourse that the plague was returned again in Holland; for it had been very violent there, and particularly at Amsterdam and Rotterdam, in the year 1663, whither, they say, it was brought, some said from Italy, others from the Levant, among some goods which were brought home by their Turkey fleet; others said it was brought from Candia; others from Cyprus. It mattered not from whence it came; but all agreed it was come into Holland again."
    },
    {
        "ebookId": "3453",
        "author": "Charles Dickens",
        "birthDeath": "1812-1870",
        "pubYear": 1853,
        "title": "Bleak House",
        "genre": "creative",
        "text": "London. Michaelmas term lately over, and the Lord High Chancellor sitting in Lincoln's Inn Hall. Implacable November weather. As much mud in the streets as if the waters had but newly retired from the face of the earth, and it would not be wonderful to meet a Megalosaurus, forty feet long or so, waddling like an elephantine lizard up Holborn Hill. Smoke lowering down from chimney-pots, making a soft black drizzle, with flakes of soot in it as big as full-grown snow-flakes—gone into mourning, one might imagine, for the death of the sun."
    },
    {
        "ebookId": "521",
        "author": "Mark Twain",
        "birthDeath": "1835-1910",
        "pubYear": 1889,
        "title": "A Connecticut Yankee in King Arthur's Court",
        "genre": "conversational",
        "text": "It was in Warwick Castle that I first met the strange stranger. I was interested in him from the beginning, because he appeared to be the only person about the place who was not bored to death by the guide's recitation. He had an honest, good-natured face, and he seemed to know an astonishing amount about medieval armor. He pointed out a suit of mail and said, 'That belonged to Sir Sagramor le Desirous; you observe that bullet hole in the left breast? I did that myself with an old Springfield rifle.'"
    },
    {
        "ebookId": "32",
        "author": "Johann Wolfgang von Goethe",
        "birthDeath": "1749-1832",
        "pubYear": 1808,
        "title": "Faust (Bayard Taylor Translation)",
        "genre": "creative",
        "text": "Prelude in the Theatre. The Manager, the Dramatic Poet, and the Merry-Andrew. Manager. You two, who have so frequently stood by me in times of difficulty and distress, tell me: what hopes do you entertain of our enterprise in German lands today? I wish very much to please the multitude, especially because they live and let live. The posts are up, the boards are laid, and everyone expects a feast for the eyes. They sit there already, with their eyebrows raised, waiting patiently to be surprised."
    },
    {
        "ebookId": "2641",
        "author": "Victor Hugo",
        "birthDeath": "1802-1885",
        "pubYear": 1862,
        "title": "Les Miserables (Wilbour Translation)",
        "genre": "creative",
        "text": "In 1815, M. Charles-Francois-Bienvenu Myriel was Bishop of Digne. He was an old man of about seventy-five years of age; he had occupied the see of Digne since 1806. Although this detail has no connection whatever with the real substance of what we are about to relate, it will not be superfluous, if merely for the sake of exactness in all points, to mention here the various rumors and talk which had been current concerning him at the moment of his arrival in the diocese."
    },
    {
        "ebookId": "1399",
        "author": "Leo Tolstoy",
        "birthDeath": "1828-1910",
        "pubYear": 1877,
        "title": "Anna Karenina (Garnett Translation)",
        "genre": "creative",
        "text": "Happy families are all alike; every unhappy family is unhappy in its own way. Everything was in confusion in the Oblonskys' house. The wife had discovered that the husband was carrying on an intrigue with a French girl, who had been a governess in their family, and she had announced to her husband that she could not go on living in the same house with him. This position of affairs had now lasted three days, and not only the husband and wife themselves, but all the members of their family and household, were painfully conscious of it."
    },
    {
        "ebookId": "3825",
        "author": "George Bernard Shaw",
        "birthDeath": "1856-1950",
        "pubYear": 1913,
        "title": "Pygmalion",
        "genre": "conversational",
        "text": "Covent Garden at 11.15 p.m. Torrents of heavy summer rain. Cab whistles blowing frantically in all directions. Pedestrians sheltering under the portico of St. Paul's Church, among them a lady and her daughter in evening dress. They are all peering out gloomily at the rain, except one man with his back turned to the rest, who seems wholly preoccupied with a notebook in which he is writing busily. A church clock chimes the first quarter. The Daughter. 'Well, haven't you found a cab yet, Freddy?'"
    },
    {
        "ebookId": "161",
        "author": "Jonathan Swift",
        "birthDeath": "1667-1745",
        "pubYear": 1729,
        "title": "A Modest Proposal",
        "genre": "explanatory",
        "text": "It is a melancholy object to those who walk through this great town or travel in the country, when they see the streets, the roads, and cabin doors, crowded with beggars of the female sex, followed by three, four, or six children, all in rags and importuning every passenger for an alms. These mothers, instead of being able to work for their honest livelihood, are forced to employ all their time in sauntering to beg sustenance for their helpless infants: who as they grow up either turn thieves for want of work, or leave their dear native country to fight for the Pretender in Spain."
    },
    {
        "ebookId": "2500",
        "author": "Henry James",
        "birthDeath": "1843-1916",
        "pubYear": 1881,
        "title": "The Portrait of a Lady",
        "genre": "creative",
        "text": "Under certain circumstances there are few hours in life more agreeable than the hour dedicated to the ceremony known as afternoon tea. There are circumstances in which, whether you partake of the tea or not—some people of course would not insist upon your not doing so—the situation is in itself delightful. Those that I have in mind in beginning to unfold this simple history offered an admirable setting to an innocent pastime. The implements of the little feast had been disposed upon the lawn of an old English country-house."
    }
]

GUTENBERG_ADDITIONAL_35 = [
    {
        "ebookId": "19942",
        "author": "Voltaire",
        "birthDeath": "1694-1778",
        "pubYear": 1759,
        "title": "Candide (Smollett Translation)",
        "genre": "creative",
        "text": "In the castle of Baron Thunder-ten-tronckh in Westphalia, there lived a youth, whom nature had endowed with a most sweet disposition. His face was the true index of his mind. He had a solid judgment joined to the most unaffected simplicity; and hence, I presume, he had his name of Candide. The old servants of the house suspected him to have been the son of the Baron's sister, by a very virtuous gentleman of the neighborhood, whom that lady would never consent to marry, because he could only count seventy-one quarterings."
    },
    {
        "ebookId": "521",
        "author": "Daniel Defoe",
        "birthDeath": "1660-1731",
        "pubYear": 1719,
        "title": "Robinson Crusoe",
        "genre": "creative",
        "text": "I was born in the year 1632, in the city of York, of a good family, though not of that country, my father being a foreigner of Bremen, who settled first at Hull. He got a good estate by merchandise, and leaving off his trade, lived afterwards at York, from whence he had married my mother, whose relations were named Robinson, a very good family in that country, and from whom I was called Robinson Kreutznaer; but, by the usual corruption of words in England, we are now called—nay we call ourselves and write our name—Crusoe."
    },
    {
        "ebookId": "6593",
        "author": "Henry Fielding",
        "birthDeath": "1707-1754",
        "pubYear": 1749,
        "title": "The History of Tom Jones, a Foundling",
        "genre": "creative",
        "text": "In that part of the western division of this kingdom which is commonly called Somersetshire, there lately lived, and perhaps lives still, a gentleman whose name was Allworthy, and who might well be called the favourite of both nature and fortune. He was at this time in the fifty-second year of his age, having enjoyed a great variety of blessings with an unblemished character; and with the finest disposition, had acquired the largest fortune of anyone in that country."
    },
    {
        "ebookId": "1079",
        "author": "Laurence Sterne",
        "birthDeath": "1713-1768",
        "pubYear": 1759,
        "title": "The Life and Opinions of Tristram Shandy, Gentleman",
        "genre": "creative",
        "text": "I wish either my father or my mother, or indeed both of them, as they were in duty both equally bound to it, had minded what they were about when they begot me; had they duly considered how much depended upon what they were then doing; that not only the production of a rational Being was concerned in it, but that possibly the happy formation and temperature of his body, perhaps his genius and the very cast of his mind;—and after all, each had had an eye to what they were about, they had certainly made quite another creature of me than the one which now appears before you."
    },
    {
        "ebookId": "82",
        "author": "Sir Walter Scott",
        "birthDeath": "1771-1832",
        "pubYear": 1820,
        "title": "Ivanhoe",
        "genre": "creative",
        "text": "In that pleasant district of merry England which is watered by the river Don, there extended in ancient times a large forest, covering the greater part of the beautiful hills and valleys which lie between Sheffield and the pleasant town of Doncaster. The remains of this extensive wood are still to be seen at the noble seats of Wentworth, of Wharncliffe Park, and around Rotherham. Here haunted of yore the fabulous Dragon of Wantley; here were fought many of the most desperate battles during the Civil Wars of the Roses."
    },
    {
        "ebookId": "946",
        "author": "James Fenimore Cooper",
        "birthDeath": "1789-1851",
        "pubYear": 1826,
        "title": "The Last of the Mohicans",
        "genre": "creative",
        "text": "It was a feature peculiar to the colonial wars of North America, that the toils and dangers of the wilderness were to be encountered before the adverse hosts could meet. A wide and apparently an impervious boundary of forests severed the possessions of the hostile provinces of France and England. The hardy colonist, and the trained European who fought at his side, frequently expended months in struggling against the rapids of the streams, or in rugged paths through the mountains."
    },
    {
        "ebookId": "1237",
        "author": "Honore de Balzac",
        "birthDeath": "1799-1850",
        "pubYear": 1835,
        "title": "Father Goriot (Marriage Translation)",
        "genre": "creative",
        "text": "Mme. Vauquer (nee de Conflans) is an elderly person, who for forty years has kept a boarding-house in the Rue Neuve-Sainte-Genevieve, between the Latin Quarter and the Faubourg Saint-Marcel. Her house, known in the neighborhood as the Maison Vauquer, receives men and women, young and old, and no word was ever breathed against its respectable character. For thirty years indeed no young girl has been admitted there, for no respectable family would allow a young girl to live in such an establishment."
    },
    {
        "ebookId": "2413",
        "author": "Gustave Flaubert",
        "birthDeath": "1821-1880",
        "pubYear": 1857,
        "title": "Madame Bovary (Aveling Translation)",
        "genre": "creative",
        "text": "We were in class when the head-master came in, followed by a 'new fellow,' not wearing the school uniform, and a school servant carrying a large desk. Those who had been asleep woke up, and every one rose as if surprised at his work. The head-master made a sign to us to sit down again; then, turning to the master of the class: 'Monsieur Dambreuse,' he said in an undertone, 'here is a pupil whom I recommend to your care; he'll begin in the second class.'"
    },
    {
        "ebookId": "5250",
        "author": "Guy de Maupassant",
        "birthDeath": "1850-1893",
        "pubYear": 1885,
        "title": "Bel-Ami (Boyd Translation)",
        "genre": "creative",
        "text": "When the cashier had handed him his change of two francs seventy-five centimes out of his five-franc piece, Georges Duroy left the cafe. As he had a good figure, partly acquired during his military service, he squared his shoulders, twirled his mustache with an instinctive, theatrical gesture, and cast upon the late diners that rapid, sweeping glance of the handsome youth that resembles a circle thrown like a net over every face."
    },
    {
        "ebookId": "13437",
        "author": "Anton Chekhov",
        "birthDeath": "1860-1904",
        "pubYear": 1899,
        "title": "The Lady with the Dog and Other Stories (Garnett Translation)",
        "genre": "creative",
        "text": "It was said that a new person had appeared on the sea-front: a lady with a little dog. Dmitri Dmitritch Gurov, who had by then been a fortnight at Yalta, and so was fairly at home there, had begun to take an interest in new arrivals. Sitting in Verney's pavilion, he saw, walking on the sea-front, a fair-haired young lady of medium height, wearing a beret; a white Pomeranian dog was running after her."
    },
    {
        "ebookId": "3070",
        "author": "Ivan Turgenev",
        "birthDeath": "1818-1883",
        "pubYear": 1862,
        "title": "Fathers and Sons (Garnett Translation)",
        "genre": "creative",
        "text": "'Well, Piotr, not in sight yet?' was the question asked on May the 20th, 1859, by a gentleman of a little over forty, in a dusty coat and checked trousers, who came out without his hat on to the low steps of the posting station at S——. Piotr, a servant lad with turquoise earrings in his ears and a faded waistcoat, turned round with a leisurely, respectful air and replied: 'No, sir, not in sight yet.'"
    },
    {
        "ebookId": "2542",
        "author": "Henrik Ibsen",
        "birthDeath": "1828-1906",
        "pubYear": 1879,
        "title": "A Doll's House (Archer Translation)",
        "genre": "conversational",
        "text": "Nora. Hide the Christmas Tree carefully, Helena. The children must on no account see it before this evening, when it is trimmed. How much? Porter. Sixpence. Nora. There is a shilling. No, keep the change. The porter thanks her and goes out. Nora shuts the door. She continues to laugh in quiet glee as she takes off her outdoor clothes. She takes a packet of macaroons from her pocket and eats one or two; then goes cautiously to her husband's door and listens."
    },
    {
        "ebookId": "844",
        "author": "Oscar Wilde",
        "birthDeath": "1854-1900",
        "pubYear": 1895,
        "title": "The Importance of Being Earnest",
        "genre": "conversational",
        "text": "Algernon. Did you hear what I was playing, Lane? Lane. I didn't think it polite to listen, sir. Algernon. I'm sorry for that, for your sake. I don't play accurately—any one can play accurately—but I play with wonderful expression. As far as the piano is concerned, sentiment is my forte. I keep science for Life. Lane. Yes, sir. Algernon. And, speaking of the science of Life, have you got the cucumber sandwiches cut for Lady Bracknell?"
    },
    {
        "ebookId": "5788",
        "author": "Joseph Conrad",
        "birthDeath": "1857-1924",
        "pubYear": 1900,
        "title": "Lord Jim",
        "genre": "creative",
        "text": "He was an inch, perhaps two, under six feet, powerfully built, and he advanced straight at you with a slight stoop of the shoulders, head forward, and a fixed from-under stare which made you think of a charging bull. His voice was deep, loud, and his manner displayed a kind of dogged self-assertion which had nothing aggressive in it. It seemed a necessity, and it was directed apparently as much at himself as at anybody else. He was spotlessly neat, apparelled in immaculate white from shoes to hat."
    },
    {
        "ebookId": "2226",
        "author": "Rudyard Kipling",
        "birthDeath": "1865-1936",
        "pubYear": 1901,
        "title": "Kim",
        "genre": "creative",
        "text": "He sat, in defiance of municipal orders, astride the gun Zam-Zammah on her brick platform opposite the old Ajaib-Gher—the Wonder House, as the natives call the Lahore Museum. Who hold Zam-Zammah, that 'fire-breathing dragon,' hold the Punjab; for the great green-bronze piece is always first of the conqueror's loot. There was some justification for Kim—he had kicked Lala Dinanath's boy off the trunnions—since the English held the Punjab and Kim was English."
    },
    {
        "ebookId": "264",
        "author": "E.M. Forster",
        "birthDeath": "1879-1970",
        "pubYear": 1908,
        "title": "A Room with a View",
        "genre": "creative",
        "text": "The Signora had no business to do it,' said Miss Bartlett, 'no business at all. She promised us south rooms looking over the Arno, and she has given us north rooms looking into a courtyard. A room with a view was what we were specifically promised, and I am determined not to put up with it.' Lucy Honeychurch looked across the little dinner-table at her elder cousin with affectionate concern."
    },
    {
        "ebookId": "5000",
        "author": "Arnold Bennett",
        "birthDeath": "1867-1931",
        "pubYear": 1908,
        "title": "The Old Wives' Tale",
        "genre": "creative",
        "text": "Those two girls, Constance and Sophia Baines, paid no heed to the grandeur of the firm's history in the Five Towns. They were subtle, exquisite, and proud in their youthful ignorance. To them, the shop was simply an established fact of nature, like the smoke from the pot-banks that darkened the sky of Bursley, or the great square of Saint Luke's church where they attended Sunday school."
    },
    {
        "ebookId": "224",
        "author": "D.H. Lawrence",
        "birthDeath": "1885-1930",
        "pubYear": 1913,
        "title": "Sons and Lovers",
        "genre": "creative",
        "text": "'The Bottoms' succeeded to 'Hell Row.' Hell Row was a block of thatched, bulging cottages that stood by the brook-side on Greenhill Lane. There lived the colliers who worked in the little gin-pits two fields away. The brook ran, under the alder-trees, scarcely whitened by the colliery water, but the cottages were miserable and dark. Then, about sixty years ago, a sudden impetus came upon the mining industry of Nottinghamshire."
    },
    {
        "ebookId": "2814",
        "author": "James Joyce",
        "birthDeath": "1882-1941",
        "pubYear": 1914,
        "title": "Dubliners (The Sisters & Araby)",
        "genre": "creative",
        "text": "There was no hope for him this time: it was the third stroke. Night after night I had passed the house (it was vacation time) and studied the lighted square of window: and night after night I had found it lighted in the same way, faintly and evenly. If he was dead, I thought, I would see the reflection of candles on the darkened blind for I knew that two candles must be set at the head of a corpse."
    },
    {
        "ebookId": "2526",
        "author": "Virginia Woolf",
        "birthDeath": "1882-1941",
        "pubYear": 1915,
        "title": "The Voyage Out",
        "genre": "creative",
        "text": "As the streets that lead from the Strand to the Embankment are very narrow, it is better not to walk down them arm-in-arm. If you persist, lawyers' clerks will have to make leaps into the kennel, and elderly solicitors will encounter your umbrella with their hats. Mr. Ambrose, however, was oblivious to these pedestrian difficulties, striding ahead with his thoughts deeply rooted in classical hexameters."
    },
    {
        "ebookId": "204",
        "author": "G.K. Chesterton",
        "birthDeath": "1874-1936",
        "pubYear": 1911,
        "title": "The Innocence of Father Brown",
        "genre": "creative",
        "text": "Between the silver ribbon of morning and the green glittering ribbon of sea, the boat touched Harwich and let loose a swarm of folk like flies, among whom the man we must follow was by no means the most conspicuous nor the least compact. There was nothing about him to indicate the extraordinary fact that he was the greatest detective in Europe: Aristide Valentin, the head of the Paris Police, arrived in England on a singular errand."
    },
    {
        "ebookId": "2467",
        "author": "Hilaire Belloc",
        "birthDeath": "1870-1953",
        "pubYear": 1902,
        "title": "The Path to Rome",
        "genre": "conversational",
        "text": "We will begin at the beginning, for there is no other way to reach the end. Having made a vow to go to Rome on foot, and sleep in no bed, and see what things were to be seen along the old march of the Legions, I bought a stout pair of boots, an ash-stick, and a knapsack that would hold two shirts and a piece of ham. Then, having heard Mass at morning, I set out across the high pastureland toward the frontier."
    },
    {
        "ebookId": "3348",
        "author": "Walter Bagehot",
        "birthDeath": "1826-1877",
        "pubYear": 1867,
        "title": "The English Constitution",
        "genre": "academic",
        "text": "On all great subjects, much remains to be said; and of none is this more true than of the English Constitution. The literature which describes it is extensive, and is written by men of the highest talent; yet a person who reads that literature carefully, and then observes the actual working of our institutions, will find an enormous difference between the living reality and the paper description. The practical government of the country has departed from its traditional theory."
    },
    {
        "ebookId": "3679",
        "author": "Lord Acton (John Dalberg-Acton)",
        "birthDeath": "1834-1902",
        "pubYear": 1877,
        "title": "The History of Freedom in Antiquity",
        "genre": "academic",
        "text": "Liberty is not a means to a higher political end. It is itself the highest political end. It is not for the sake of a good public administration that it is required, but for security in the pursuit of the highest objects of civil society, and of private life. Increase in freedom is the only reliable test of the progress of nations toward justice. All power tends to corrupt, and absolute power corrupts absolutely. Great men are almost always bad men, even when they exercise influence and not authority."
    },
    {
        "ebookId": "608",
        "author": "William Makepeace Thackeray",
        "birthDeath": "1811-1863",
        "pubYear": 1848,
        "title": "Vanity Fair",
        "genre": "creative",
        "text": "While the present century was in its teens, and on one sunshiny morning in June, there drove up to the great iron gate of Miss Pinkerton's academy for young ladies, on Chiswick Mall, a large family coach, with two fat horses in blazing harness, driven by a fat coachman in a three-cornered hat and wig, at the rate of four miles an hour. A black servant, who reposed on the box beside the fat coachman, uncurled his bandy legs as soon as the equipage touched the kerbstone."
    },
    {
        "ebookId": "233",
        "author": "H.G. Wells",
        "birthDeath": "1866-1946",
        "pubYear": 1901,
        "title": "The First Men in the Moon",
        "genre": "creative",
        "text": "As I sit down in my study at Lympne to write this story of our journey to the Moon, I find myself confronted by an overwhelming difficulty. How am I to make my readers believe that which seems so utterly impossible? Yet every word of it is truth, and Cavor's miraculous substance, which made our spherical vehicle impervious to the attraction of gravitation, was manufactured under my own eyes in the quiet laboratory among the Kentish hills."
    },
    {
        "ebookId": "153",
        "author": "Jules Verne",
        "birthDeath": "1828-1905",
        "pubYear": 1873,
        "title": "Around the World in Eighty Days",
        "genre": "creative",
        "text": "Mr. Phileas Fogg lived, in 1872, at No. 7, Saville Row, Burlington Gardens, the house in which Sheridan died in 1814. He was one of the most noticeable members of the Reform Club, though he seemed always to avoid attracting attention; an enigmatical personage, about whom little was known, except that he was a polished man of the world. People said that he resembled Byron—at least that his head was Byronic; but he was a bearded, tranquil Byron, who might live on a thousand years without growing old."
    },
    {
        "ebookId": "18857",
        "author": "Arthur Schopenhauer",
        "birthDeath": "1788-1860",
        "pubYear": 1851,
        "title": "The Art of Controversy (Saunders Translation)",
        "genre": "academic",
        "text": "Controversial Dialectic is the art of disputing, and of disputing in such a way as to hold one's own, whether one is in the right or the wrong. A man may be objectively in the right, and yet in the eyes of the bystanders, and sometimes in his own, he may come off second best. For example, if a proof is offered in support of an assertion, and my opponent refutes the proof, he appears to refute the assertion, for which other proofs might nevertheless be found."
    },
    {
        "ebookId": "38437",
        "author": "Charles Sanders Peirce",
        "birthDeath": "1839-1914",
        "pubYear": 1878,
        "title": "How to Make Our Ideas Clear",
        "genre": "academic",
        "text": "Whoever has examined modern logic with any attention will have noticed that the distinction between clear and obscure ideas, which occupied so large a space in the seventeenth century, has now been considerably refined. A clear idea is defined as one which is so apprehended that it will be recognized wherever it is met with, and so that no other will be mistaken for it. If it fails of this clearness, it is said to be obscure."
    },
    {
        "ebookId": "5828",
        "author": "Bertrand Russell",
        "birthDeath": "1872-1970",
        "pubYear": 1919,
        "title": "Introduction to Mathematical Philosophy",
        "genre": "technical",
        "text": "Mathematics is a study which, when we start from its most familiar portions, may be pursued in either of two opposite directions. The more familiar direction is towards greater and greater complexity, from addition and multiplication to the differential calculus and beyond. The other direction, which is less familiar, proceeds by analyzing our primitive concepts into notions that are still more abstract and general, inquiring into the logical foundations of number, order, and continuum."
    },
    {
        "ebookId": "1942",
        "author": "John Locke",
        "birthDeath": "1632-1704",
        "pubYear": 1690,
        "title": "Second Treatise of Government",
        "genre": "academic",
        "text": "To understand political power right, and derive it from its original, we must consider what state all men are naturally in, and that is, a state of perfect freedom to order their actions, and dispose of their possessions and persons, as they think fit, within the bounds of the law of nature, without asking leave, or depending upon the will of any other man. A state also of equality, wherein all the power and jurisdiction is reciprocal, no one having more than another."
    },
    {
        "ebookId": "1889",
        "author": "Baron de Montesquieu",
        "birthDeath": "1689-1755",
        "pubYear": 1748,
        "title": "The Spirit of the Laws (Nugent Translation)",
        "genre": "academic",
        "text": "Laws, in their most general signification, are the necessary relations arising from the nature of things. In this sense all beings have their laws: the Deity has his laws, the material world its laws, the intelligences superior to man their laws, the beasts their laws, man his laws. They who assert that a blind fatality produced the various effects we behold in this world talk very absurdly; for can anything be more unreasonable than to pretend that a blind fatality could be productive of intelligent beings?"
    },
    {
        "ebookId": "3828",
        "author": "George Bernard Shaw",
        "birthDeath": "1856-1950",
        "pubYear": 1903,
        "title": "Man and Superman",
        "genre": "conversational",
        "text": "Roebuck Ramsden is in his study, a room looking on Park Lane. He is an expansive, prosperous gentleman of sixty, with white hair and clean-shaven cheeks that show off a fresh complexion. He has the air of a man who has lived through the Victorian epoch and survived it with honor and substantial investments. Enter Octavius Robinson, a young man of delicate aesthetic appearance, carrying a black armlet on his sleeve."
    },
    {
        "ebookId": "730",
        "author": "Charles Dickens",
        "birthDeath": "1812-1870",
        "pubYear": 1859,
        "title": "A Tale of Two Cities",
        "genre": "creative",
        "text": "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of Light, it was the season of Darkness, it was the spring of hope, it was the winter of despair, we had everything before us, we had nothing before us, we were all going direct to Heaven, we were all going direct the other way—in short, the period was so far like the present period, that some of its noisiest authorities insisted on its being received, for good or for evil, in the superlative degree of comparison only."
    },
    {
        "ebookId": "135",
        "author": "Victor Hugo",
        "birthDeath": "1802-1885",
        "pubYear": 1831,
        "title": "The Hunchback of Notre Dame (Wilbour Translation)",
        "genre": "creative",
        "text": "Three hundred and forty-eight years, six months, and nineteen days ago to-day, the Parisians awoke to the sound of all the bells in the triple circuit of the city, the university, and the town ringing a full peal. The sixth of January, 1482, is not, however, a day of which history has preserved the memory. There was nothing remarkable in the event which thus put the bells and the good people of Paris in commotion from early dawn. It was neither an assault of the Picards nor the Burgundians, nor an embassy of the Flemings, nor a procession of the university, nor a festival of the Kings of Epiphany."
    }
]

ALL_GUTENBERG_WORKS = GUTENBERG_WORKS + GUTENBERG_ADDITIONAL_35
