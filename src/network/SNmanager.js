/*
* Created by wonsup
 *  */

/*
* 1. root : 시멘틱 네트워크의 root node. init function에서 정의됨
* 2. gss : 사용하는 gss node들의 리스트.
* 3. nodeList : root, gss 노드를 제외한 모든 node들의 리스트
* 4. edgeList : 모든 edge들의 리스트
* 5. attributes : 현재 사용하고 있는 데이터셋의 모든 attribute들을 나타내는 리스트
*                 (차후에 있을 수 있는 수정에 대한 확장성을 고려함)
* */
function SNmanager(attributes){
    this.root = null;
    this.gss = {}; // dictionary로 gssNode객체 저장. key는 각 gss Node의 value.
    this.nodeDict = {}; // key는 [attribute, value] value는 node의 객체
    this.attributes = attributes;
}

//root,gss 노드들 생성 및 연결 -> 가장 기본적 SN구조 생성
SNmanager.prototype.init= function(){
    //root, gss 노드들 생성
    this.root = new Node('root','me');
    var gssList = ['food','sleep','activity'];
    for(var i=0; i<gssList.length; i++){
        var gssNode= new Node('gss', gssList[i]);
        this.gss[gssList[i]] = gssNode;
        // root와 gss노드들 연결
        this.addNode(this.root, gssNode);
    }
}

//SN을 생성한다.
//1. SclabUtil 객체의 readInputFile 함수로부터 받은 데이터셋을 입력으로 받는다.
//2. 데이터셋의 각 행에 대한 for문
//2-1 첫번째 열 원소인 start-time에 대한 노드 생성 및 알맞은 gss노드와 연결(linkStartNode2gssNode 함수역할)
//2-2 데이터 한 행의 각 열에 대한 for문
//2-2-1 원소에 대한 노드가 존재하는지 확인
//2-2-2 존재한다면 해당 노드 call
//2-2-3 존재하지 않는다면 새로운 노드 생성
//2-2-4 위에서 얻은노드와 startNode연결
SNmanager.prototype.makeSN = function(dataset){
    for(var idx=0; idx<dataset.length; idx++){
        var one_data = dataset[idx];
        var startNode = new Node(this.attributes[0],one_data[0]);
        this.nodeDict[this.attributes[0],one_data[0]] = startNode;
        var activityAttributeIndex = this.attributes.indexOf('activity'); // activity가 몇번째 컬럼에 있는지 찾기
        var targetGss = this.linkStartNode2gssNode(one_data[activityAttributeIndex]);
        this.addNode(targetGss, startNode);

        for(var j=0; j<(this.attributes.length-1); j++) {
            if(one_data[j+1] == '/' || one_data[j+1] == '') {
                continue;
            }
            var tmpNode = new Node(this.attributes[j+1], one_data[j+1]);
            if([this.attributes[j+1], one_data[j+1]] in this.nodeDict){
                continue;
                console.log('coupled');
            }
            this.nodeDict[this.attributes[j+1], one_data[j+1]] = tmpNode;
            this.addNode(startNode, tmpNode);
        }
    }
}

//두 노드간의 edge생성 + 두 노드들에 대한 부모,자식,엣지 정보 각 노드들에 저장
SNmanager.prototype.addNode = function(from, to){
    var edge= new Edge(from,to);

    from.children_list.push(to);
    to.parents_list.push(from);

    from.edge_list.push(edge);
    to.edge_list.push(edge);
}

//시작시간 노드(startNode)를 알맞은 gss node와 연결한다.
SNmanager.prototype.linkStartNode2gssNode = function(activity){
    //잠, 수면, 취침 이란 단어가 있으면서 준비 라는 단어가 없는 경우,
    if (activity.indexOf('잠')!=-1 || activity.indexOf('수면')!=-1 || activity.indexOf('취침')!=-1){
        return this.gss['sleep'];
    }
    if (activity.indexOf('식사')!=-1 || activity.indexOf('아침')!=-1 || activity.indexOf('점심')!=-1 || activity.indexOf('저녁')!=-1 || activity.indexOf('밥')!=-1){
        return this.gss['food'];
    }
    return this.gss['activity'];
}

//gss value, 시작시간의 (시간단위 까지의) 값, 그리고 attribute를 입력으로 받아서 해당 attribute에 대한 node들이 있는지 탐색함.
// 있다면 그 노드들의 값들을 return.
SNmanager.prototype.searchNode = function(gss, time, attribute){
    var gssNode = this.gss[gss];
    //시작노드들 중에서 그 시간대(YYYY-MM-DD-HH)에 있는 시작노드 list 들고옴.
    var query_split =  time.split("-");
    var query_date = query_split[0] + "-" + query_split[1] + "-" + query_split[2];
    var query_hour = query_split[3];

    var highlightedStartNodeList = [];
    for(var i=0; i < gssNode.children_list.length; i++){
        var node_split = gssNode.children_list[i].value.split(" "); // 0: date, 1: hh:mm:ss
        var node_hour = node_split[1].split(":");
        node_hour = node_hour[0];
        if(query_date == node_split[0] && query_hour == node_hour){
            highlightedStartNodeList.push(gssNode.children_list[i]);
        }
    }
    //각 시작노드에서 'attribute' 파라미터를 attribute로 가지는 노드의 값 + 종료시간 노드의 값을 시작 순서대로 리포팅
    var highligtedProperties = [] // 추후 확장성을 위하여 각 값 변수에 저장

    for(var i=0; i < highlightedStartNodeList.length; i++) {
        var tmp_list = [];

        tmp_list.push(highlightedStartNodeList[i].value);
        tmp_list.push(highlightedStartNodeList[i].getChildByAttr('end_time').value);
        tmp_list.push(highlightedStartNodeList[i].getChildByAttr(attribute).value);
        highligtedProperties.push(tmp_list);
        // console.log(tmp_list[0] + "  ~  " + tmp_list[1] + '   : ' + tmp_list[2]);
    }

    return highligtedProperties;
};

// 규칙 기반 탐색
//규칙-수면1 : 일어난 뒤 감정상태
SNmanager.prototype.getEmotionAfterWakeUp = function () {
    const sleep = this.gss['sleep']
    console.log('sleep.edge_list')
    console.log(sleep.edge_list)
    const sleepEndTimes = [];
    console.log(sleep.children_list);


    for (const sleepStartTime of sleep.children_list) {
        sleepEndTimes.push(sleepStartTime.getChildByAttr('end_time').value)
    }
    console.log('sleepEndTimes')
    console.log(sleepEndTimes)
    const activity = this.gss['activity'];
    console.log('activity.children_list')
    console.log(activity.children_list)

    var EmotionList = [];
    console.log(activity.children_list[0].value);
    for(const sleepEndTime of sleepEndTimes) {
        for (var i = 0; i < activity.children_list.length; i++) {
            if(activity.children_list[i].value == sleepEndTime){
                console.log('check');
                EmotionList.push(activity.children_list[i].getChildByAttr('emotion').value);
                // console.log('edge_list')
                // console.log(activity.children_list[i].getChildByAttr('emotion').edge_list)
            }
        }
    }
    console.log(EmotionList);
    return EmotionList;
}

//규칙-수면2 : 피로도가 가장 낮은 시간대
// 5-8시, 8-10시, 10-17시, 17-20시, 20-5시로 나눠서 개수 세기
SNmanager.prototype.getTime_BestCondition = function(){
    const activity = this.gss['activity'];
    const activityStartTimes = [];
    for (const activityStartTime of activity.children_list){
        if(activityStartTime.getChildByAttr("tiredness")=="아주 낮음" || "낮음"){
            activityStartTimes.push(activityStartTime.value);
        }
    }
    console.log("activityStartTimes" + activityStartTimes);
    return activityStartTimes;
}



// 규칙-수면3: 잠들기 직전 1시간 이내 스마트폰 15분 이상 사용 빈도
SNmanager.prototype.getSmartphoneUseBeforeSleep = function() {
    const smartphoneUseList = []
    for (const activity of this.gss['activity'].children_list){
        if (activity.getChildByAttr('activity').value == '수동적 여가|스마트폰' && new Date(activity.getChildByAttr('end_time').value) - new Date(activity.value) >= 15 * 60 * 1000 ) {
            smartphoneUseList.push(activity)
        }
    }
    console.log(smartphoneUseList)
    let count = 0
    for (let sleepStartTime of this.gss['sleep'].children_list) {
        sleepStartTime = new Date(sleepStartTime.value)
        for (let smartphoneUseTime of smartphoneUseList) {
            const gap = sleepStartTime - new Date(smartphoneUseTime.value)
            if (gap> 0 && gap <= 60 * 60 * 1000) {
                count++
            }
        }
    }
    return [count, this.gss['sleep'].children_list.length]
}

// // 규칙-수면4: 잠들기 전 피로도가 높아지는 시간대
//                     SNmanager.prototype.getTirednessBeforeSleep = function () {
//                         const activityStartTimes = this.gss['activity'].children_list
//                         const activityDates = {}
//                         for (const activityStartTime of activityStartTimes) {
//                             const date = activityStartTime.value.split(' ')[0]
//                             if (activityDates[date] == null) {
//                                 activityDates[date] = []
//                             }
//                             activityDates[date].push(activityStartTime)
//                         }
//                         console.log('activityDates')
//                         console.log(activityDates)
//                         const sleepStartTimes = this.gss['sleep'].children_list
//                         const result = [sleepStartTimes.length]
//                         for (let endTime of sleepStartTimes) {
//                             const activitySet = activityDates[endTime.value.split(' ')[0]]
//                             let tiredness = '매우 높음'
//                             let flag = true
//                             while (tiredness == '매우 높음' || tiredness == '높음' && flag) {
//                                 flag = false
//                                 for (const activityStartTime of activitySet) {
//                                     if (activityStartTime.getChildByAttr('end_time').value == endTime.value) {
//                     tiredness = activityStartTime.getChildByAttr('tiredness')
//                     endTime = activityStartTime.value
//                     flag = true
//                 }
//                 if (flag) break
//             }
//             alert(endTime.value)
//         }
//         result.push(endTime)
//     }
//     alert('done')
//     return result
// }

//규칙-수면5 : 4시간 이하의 수면 횟수
//수면시간이 4시간보다 짧은 날이 많으면 불면증이라고 추론
SNmanager.prototype.getSleepTime = function(){
    const sleeps = this.gss['sleep']
    const sleep = sleeps.children_list
    let shortsleep = 0;
    for(const sleeping of sleep){
        var sleepStart = new Date(sleeping.value)
        var sleepEnd = new Date(sleeping.getChildByAttr('end_time').value)
        if((sleepEnd-sleepStart)<= 1000*60*60*4) {//수면시간이 4시간보다 짧다면
            shortsleep++;
        }
    }
    const sleep_time = [shortsleep, sleep.length]
    return sleep_time
}

//규칙-수면6 : 수면 시작 시간 분포
//낮잠을 제외하기 위해 저녁 6시 - 새벽5시까지로 제한
SNmanager.prototype.getSleepStartTime = function(){
    const sleeps = this.gss['sleep']
    const sleep = sleeps.children_list
    const sleepStartTime = [];
    for(const sleeping of sleep){
        let sleep_split = sleeping.value.split(" ")
        let sleep_hour = sleep_split[1].split(":")
        if(sleep_hour[0]<= 5 || sleep_hour[0]>=18){
            sleepStartTime.push(sleep_hour[0])
        }
    }
    return sleepStartTime
}

//규칙-수면7 : 수면 횟수 분포
//수면 횟수가 많다는 사람은 잠에서 자주 깬다는 뜻이고 이는 불면증을 추론할 수 있음
//잠이 이틀에 걸쳐서 일어날 수 있기 때문에 잠을 잔 모든 횟수를 날짜별로 계산하고 각각을 2로 나누는 방식으로 추론
SNmanager.prototype.getSleepNum = function(){
    const sleeps = this.gss['sleep']
    const sleep = sleeps.children_list
    const start_date = sleep[0].value;
    let start_day = (new Date(start_date.split(" ")[0])/(1000*60*60*24));
    const end_date = sleep[sleep.length-1].value;
    let end_day = (new Date(end_date.split(" ")[0])/(1000*60*60*24));
    const sleepNum = [];
    const duration = end_day-start_day+1;
    for(var i=0 ; i< duration;i++){
        sleepNum[i] = 0;
    }

    for(let sleeping of sleep){
        const sleep_start = (new Date(sleeping.value.split(" ")[0]))/(1000*60*60*24);
        const sleep_end = (new Date(sleeping.getChildByAttr('end_time').value.split(" ")[0]))/(1000*60*60*24);
        for (var i=start_day ; i<end_day; i++){
            console.log(sleeping.value);
            if(sleep_start == i){
                sleepNum[i-start_day]++;
            }
            if(sleep_end == i){
                sleepNum[i-start_day]++;
            }
    }
    }
    for(i=0; i<duration; i++){
        sleepNum[i] = sleepNum[i]/2
    }
    return sleepNum;
}

//규칙-식사1 : 하루 중 오후 7시 이후 섭취하는 음식 비율 (오후 7시 - 새벽 3시라고 가정) - 야식증 추론
//오후 7시 - 새벽 3시 사이의 음식 섭취 / 전체 음식 섭취 횟수 -> 한사람의 비율을 딱 도출해냄
SNmanager.prototype.getRatio_LateMeal = function() {
    const food = this.gss['food']
    console.log(food.children_list);
    var latemeal = 0;
    for (const meal of food.children_list) {
        var meal_split = meal.value.split(" ");// 0:date, 1: hh:mm:ss
        var meal_hour = meal_split[1].split(":");// 0:hour 1:mm
        if ((0 <= meal_hour[0] && meal_hour[0]<= 3) || (19 <= meal_hour[0] && meal_hour[0]< 24)) {
            latemeal += 1;
        }
    }
    console.log("num of latemeal")
    console.log(latemeal)
    console.log("num of entire meal")
    console.log(food.children_list.length)
    // const ratio = latemeal / food.children_list.length;
    // console.log("ratio of latemeal")
    // console.log(ratio.toFixed(2))
    // return ratio.toFixed(2);
    return [latemeal, food.children_list.length]
}

//규칙-식사2 : 식사 후 기분 분석 -> '매우 부정' '부정'이 많을수록 거식증, 폭식증이라고 추론
SNmanager.prototype.getEmotionAfterMeal = function(){
    const food = this.gss['food']
    const activity = this.gss['activity']
    const emotionlist = [];

    for(const foodtime of food.children_list){
        for(const activitytime of activity.children_list){
            if(foodtime.getChildByAttr('end_time').value == activitytime.value){
                emotionlist.push(activitytime.getChildByAttr('emotion').value)
            }
        }
    }
    console.log('emotionlist')
    console.log(emotionlist)
    return emotionlist
}

//규칙-식사3 : 식사활동의 주기를 분석 짧으면 폭식증 의심
//학교 급식시간 기준으로  점심은 12시 저녁은 5시 이니까 보통 밥 간격을 5-6시간이라고 생각
// 자는 시간을 포함해서 음식 간의 간격을 조사
// 앞의 식사의 end_time과 뒤의 start_time을 뺀다.
SNmanager.prototype.getFoodInterval = function(){
    const food = this.gss['food'];
    const eat = food.children_list;
    const gap_list = [];
    console.log(eat);
    for (var i=0; i<(eat.length-1); i++){
        const eatEndTime = new Date(eat[i].getChildByAttr('end_time').value);
        const eatStartTime = new Date(eat[i+1].value);
        const interval = (eatStartTime-eatEndTime)/(1000*60*60);
        gap_list.push(interval.toFixed(1));
    }
    return gap_list;
    }

//규칙-식사4 : 배고프지 않은데 밥을 먹는 횟수 분석
//배고프지 않아도 밥을 계속해서 먹는 횟수 및 비율을 분석함으로써 폭식증을 추론
SNmanager.prototype.getEatWhileFull = function(){
    const foods = this.gss['food'];
    let full = 0;
    const food = foods.children_list;
    for(const hunger of food){
        if (hunger.getChildByAttr('hunger').value == '아니오'){
            full++;
        }
    }
    const hungerlist = [full, food.length]
    return hungerlist;
}



// 규칙-활동1: 만나는 사람의 다양성
SNmanager.prototype.getPeople = function () {
    const activityStartTimes = this.gss['activity'].children_list
    const peopleList = [activityStartTimes.length]
    for (const activityStartTime of activityStartTimes) {
        const person = activityStartTime.getChildByAttr('person')
        let flag = false
        for (let i=0; i<peopleList.length; i++) {
            if (peopleList[i][0] == person.value) {
                peopleList[i][1]++
                flag = true
                break
            }
        }
        if (!flag) {
            peopleList.push([person.value, 0])
        }
    }
    return peopleList
}

// 규칙-활동2: 머무르는 장소의 온도 분포
SNmanager.prototype.getTemperature = function () {
    const tempList = ['매우 낮음', '낮음', '보통', '높음', '매우 높음']
    const result = [0, 0, 0, 0, 0]
    for (const activityStartTime of this.gss['activity'].children_list) {
        result[tempList.indexOf(activityStartTime.getChildByAttr('temperature').value)] += 1
    }
    return result
}

// 규칙-활동3: 실내/실외에 따른 감정 분포
SNmanager.prototype.getInOut = function () {
    const result = [[0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0]]
    const emotionIndexList = ['매우 부정', '부정', '보통', '긍정', '매우 긍정']
    for (const activityStartTime of this.gss['activity'].children_list) {
        if (activityStartTime.getChildByAttr('location').value == '실내') {
            result[0][emotionIndexList.indexOf(activityStartTime.getChildByAttr('emotion').value)]++
            result[0][5]++
        }
        else {
            result[1][emotionIndexList.indexOf(activityStartTime.getChildByAttr('emotion').value)]++
            result[1][5]++
        }
    }
    return result
}

//규칙-활동4: 혼자 밥을 먹는 빈도
SNmanager.prototype.eatAlone = function(){
    const gssNode = this.gss['food']
    let alone = 0;
    for(const node of gssNode.children_list){
        if(node.getChildByAttr('person').value == '혼자'){
            alone++;
        }
    }
    const eat = [alone, gssNode.children_list.length-alone, gssNode.children_list.length]
    return eat
}

//네트워크 노드의 ID를 재귀적으로 탐색
SNmanager.prototype.getNodeById = function (id) {
    const search = (node) => {
        if (node.attribute + node.value === id) {
            return node
        }

        for (const child_node of node.children_list) {
            const found = search(child_node)

            if (found !== null) {
                return found
            }
        }

        return null
    }

    return search(this.root)
}