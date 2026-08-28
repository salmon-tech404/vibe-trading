const fs = require('fs');
const path = require('path');

let rawQuestions = [];
if (fs.existsSync('C:/Users/TMS/Downloads/QuizApp.jsx')) {
  const originalCode = fs.readFileSync('C:/Users/TMS/Downloads/QuizApp.jsx', 'utf8');
  const start = originalCode.indexOf('const QUESTIONS = [');
  const end = originalCode.indexOf('];\n/* ---------- seeded shuffle');
  rawQuestions = eval(originalCode.substring(start + 'const QUESTIONS = '.length, end + 1));
} else if (fs.existsSync(path.join(__dirname, '..', 'questions_data.json'))) {
  rawQuestions = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'questions_data.json'), 'utf8'));
} else {
  throw new Error('No questions source found!');
}

console.log('Loaded questions count:', rawQuestions.length);

// 2. Comprehensive, ultra-clear beginner explanations for all 101 questions
const technicalExplanations = {
  1: "<strong>Hình dung đơn giản:</strong> <code>fetch()</code> giống như việc xúc <em>từng thìa cơm</em> (lấy ra 1 hàng dữ liệu đầu tiên/tiếp theo). Nếu muốn bưng <em>cả bát cơm</em> (lấy toàn bộ các hàng cùng lúc), ta phải dùng <code>fetchAll()</code>.<br><strong>Chi tiết kỹ thuật:</strong> Trong PDO, <code>$b->fetch()</code> trả về 1 mảng chứa dữ liệu của hàng hiện tại và tự động chuyển con trỏ xuống hàng kế tiếp. Các lựa chọn như <code>fetch(1)</code> hay <code>fetch(all)</code> đều là cú pháp sai.",

  2: "<strong>Hình dung đơn giản:</strong> Câu lệnh <code>UPDATE</code> (cập nhật), <code>INSERT</code> (thêm mới), <code>DELETE</code> (xóa) là những lệnh <em>làm thay đổi dữ liệu</em> chứ không trả về bảng dữ liệu để xem. Vì thế ta dùng hàm <code>exec()</code> (viết tắt của execute).<br><strong>Chi tiết kỹ thuật:</strong> <code>$db->exec($query)</code> thực thi câu lệnh và trả về <strong>số lượng dòng bị ảnh hưởng</strong> (affected rows). Đối với câu lệnh lấy dữ liệu <code>SELECT</code> thì mới dùng <code>$db->query()</code>.",

  3: "<strong>Hình dung đơn giản:</strong> Lệnh <code>DELETE</code> là thao tác xóa dữ liệu (không trả về bảng để xem), do đó trong PDO ta dùng hàm <code>$db->exec()</code>.<br><strong>Chi tiết kỹ thuật:</strong> Cú pháp chuẩn là <code>$db->exec('câu_lệnh_sql')</code>. Lựa chọn <code>$db->execute()</code> là sai vì <code>execute()</code> chỉ dùng cho đối tượng Prepare Statement (<code>$stmt->execute()</code>), không phải của đối tượng kết nối <code>$db</code>.",

  4: "<strong>Hình dung đơn giản:</strong> Tập kết quả giống như danh sách học sinh trong lớp. Để đọc hết từng bạn, ta phải <em>duyệt qua từng người một</em> bằng vòng lặp.<br><strong>Chi tiết kỹ thuật:</strong> Lập trình viên sử dụng vòng lặp <code>while ($row = $stmt->fetch())</code> để lần lượt đọc từng dòng cho đến khi hết dữ liệu.",

  5: "<strong>Hình dung đơn giản:</strong> <strong>phpMyAdmin</strong> là một trang web đồ họa giúp bạn quản lý cơ sở dữ liệu MySQL dễ dàng bằng cách click chuột (tạo bảng, sửa dữ liệu) thay vì phải gõ những dòng lệnh đen trắng phức tạp.<br><strong>Chi tiết kỹ thuật:</strong> Đây là công cụ mã nguồn mở viết bằng PHP chuyên dùng để quản trị hệ quản trị CSDL quan hệ MySQL/MariaDB.",

  6: "<strong>Hình dung đơn giản:</strong> Trong giao diện phpMyAdmin, cột bên trái hiển thị danh sách các bảng. Muốn xem dữ liệu bên trong bảng nào, bạn chỉ cần nhấp chuột vào tên bảng đó ở menu bên trái.<br><strong>Chi tiết kỹ thuật:</strong> Khi click vào tên bảng ở sidebar trái, phpMyAdmin tự động chạy câu lệnh <code>SELECT * FROM table</code> và hiển thị ở chế độ Browse.",

  7: "<strong>Hình dung đơn giản:</strong> Nút <strong>Empty</strong> (lệnh SQL <code>TRUNCATE</code>) giống như 'quét sạch rác trong phòng' (xóa hết dữ liệu nhưng vẫn giữ nguyên phòng/khung bảng). Còn nút <strong>Drop</strong> là 'đập bỏ cả ngôi nhà' (xóa sạch cả dữ liệu lẫn cấu trúc bảng).<br><strong>Chi tiết kỹ thuật:</strong> Để làm trống dữ liệu mà không làm mất cấu trúc các cột của bảng, ta dùng <strong>Empty</strong>.",

  8: "<strong>Hình dung đơn giản:</strong> Câu lệnh <code>SELECT</code> là lệnh 'tìm và lấy dữ liệu về' để hiển thị, nên trong PDO bắt buộc phải dùng hàm <code>$db->query()</code>.<br><strong>Chi tiết kỹ thuật:</strong> <code>$db->query()</code> thực thi câu lệnh SQL và trả về một đối tượng <code>PDOStatement</code> chứa tập kết quả.",

  9: "<strong>Hình dung đơn giản:</strong> Trong PHP, mảng luôn dùng dấu <strong>ngoặc vuông <code>[ ]</code></strong> để lấy phần tử. Tên khóa chữ ('Ten') phải đặt trong dấu nháy.<br><strong>Chi tiết kỹ thuật:</strong> Cú pháp đúng là <code>$b = $a['Ten']</code>. Các lựa chọn dùng dấu ngoặc tròn <code>( )</code> là cú pháp của gọi hàm, không phải của mảng.",

  10: "<strong>Hình dung đơn giản:</strong> Lập trình viên luôn đếm số bắt đầu từ <strong>0</strong>! Phần tử thứ 1 là <code>[0]</code>, thứ 2 là <code>[1]</code>, thứ 3 là <code>[2]</code>, và phần tử thứ 4 có chỉ số là <strong><code>[3]</code></strong>.<br><strong>Chi tiết kỹ thuật:</strong> Chỉ mục mảng (zero-based index) của phần tử thứ 4 là <code>$a[3]</code>.",

  11: "<strong>Hình dung đơn giản:</strong> <code>pop</code> nghĩa là 'bật ra / lấy ra phần tử ở cuối cùng'. Phần tử cuối cùng là <code>'d'=>'4'</code>, giá trị của nó là <code>4</code>, nên in ra <strong>4</strong>.<br><strong>Chi tiết kỹ thuật:</strong> Hàm <code>array_pop(&$array)</code> xóa phần tử cuối cùng của mảng và trả về giá trị (value) của phần tử đó.",

  12: "<strong>Hình dung đơn giản:</strong> <code>shift</code> nghĩa là 'lấy phần tử đầu tiên ở đầu mảng'. Trong mảng <code>['a', 'b', 'c', 'd']</code>, phần tử đầu tiên là <strong>a</strong>.<br><strong>Chi tiết kỹ thuật:</strong> Hàm <code>array_shift(&$array)</code> loại bỏ phần tử ở vị trí đầu tiên của mảng và trả về giá trị của nó.",

  13: "<strong>Hình dung đơn giản:</strong> <code>array_pop()</code> lấy phần tử ở cuối mảng. Với mảng <code>['a', 'b', 'c', 'd']</code>, phần tử cuối cùng chính là <strong>d</strong>.<br><strong>Chi tiết kỹ thuật:</strong> Hàm <code>array_pop()</code> xóa và trả về phần tử cuối cùng là <code>'d'</code>.",

  14: "<strong>Hình dung đơn giản:</strong> Mảng <code>$m</code> chỉ có 2 chìa khóa là <code>'a'</code> và <code>'b'</code>. Bạn đi tìm chìa khóa <code>'1'</code> (không hề có trong mảng) nên PHP sẽ báo lỗi/cảnh báo vì không tìm thấy.<br><strong>Chi tiết kỹ thuật:</strong> Truy cập một key không tồn tại trong mảng kết hợp sẽ sinh ra cảnh báo <em>Warning: Undefined array key \"1\"</em>.",

  15: "<strong>Hình dung đơn giản:</strong> Mảng tuần tự tự động đánh số từ 0: vị trí <code>0</code> là <code>'a'</code>, vị trí <code>1</code> là <strong><code>'b'</code></strong>.<br><strong>Chi tiết kỹ thuật:</strong> <code>$m[1]</code> truy cập phần tử ở chỉ số 1, kết quả in ra là <code>b</code>.",

  16: "<strong>Hình dung đơn giản:</strong><br>• Bước 1: <code>explode('|', ...)</code> dùng dấu <code>|</code> để chặt chuỗi thành mảng 4 chữ <code>['a', 'b', 'c', 'd']</code>.<br>• Bước 2: <code>implode(' ', ...)</code> dán 4 chữ đó lại, chèn dấu cách ở giữa $\\rightarrow$ thu được <strong><code>a b c d</code></strong>.<br><strong>Chi tiết kỹ thuật:</strong> <code>explode</code> = tách chuỗi thành mảng, <code>implode</code> = nối mảng thành chuỗi.",

  17: "<strong>Hình dung đơn giản:</strong> Nhìn kỹ dòng thứ 3: <code>implode(' ', $name)</code>. Hàm <code>implode</code> bắt buộc đối số thứ hai phải là một <strong>Mảng</strong>, nhưng người viết lại truyền vào <code>$name</code> (vốn là Chuỗi chữ thô ban đầu) $\\rightarrow$ Sai kiểu dữ liệu nên chương trình không in ra kết quả gì.<br><strong>Chi tiết kỹ thuật:</strong> Cú pháp đúng phải truyền mảng <code>$name1</code>, truyền chuỗi <code>$name</code> sẽ phát sinh lỗi Type Error.",

  18: "<strong>Hình dung đơn giản:</strong> Trong PHP truyền thống, hàm khởi tạo mảng là <code>array(...)</code>.<br><strong>Chi tiết kỹ thuật:</strong> Cú pháp khai báo mảng hợp lệ là dùng từ khóa <code>array()</code> kèm ngoặc tròn.",

  19: "<strong>Hình dung đơn giản:</strong> Khởi tạo mảng trong PHP dùng cặp dấu ngoặc tròn <code>array()</code>.<br><strong>Chi tiết kỹ thuật:</strong> <code>array(3)</code> là cú pháp chuẩn của PHP.",

  20: "<strong>Hình dung đơn giản:</strong> Để gán chữ 'abc' vào khóa 'Ten' của mảng <code>$a</code>, ta viết tên mảng kèm ngoặc vuông chứa khóa rồi dùng dấu bằng: <code>$a['Ten'] = 'abc'</code>.<br><strong>Chi tiết kỹ thuật:</strong> Trong PHP, ngoặc vuông <code>[ ]</code> dùng cho mảng, dấu nháy đơn bao bọc chuỗi khóa.",

  21: "<strong>Hình dung đơn giản:</strong> Gán số 18 cho khóa 'Tuoi' trong mảng <code>$a</code>: viết <code>$a['Tuoi'] = 18</code>.<br><strong>Chi tiết kỹ thuật:</strong> Dùng 1 dấu bằng <code>=</code> (phép gán), không dùng 2 dấu bằng <code>==</code> (phép so sánh).",

  22: "<strong>Hình dung đơn giản:</strong> Từ khóa <code>global</code> chỉ dùng để 'xin phép' lấy biến từ bên ngoài vào hàm (ví dụ: <code>global $a;</code>). Sau đó ở dòng tiếp theo mới được làm phép tính tăng <code>$a++;</code>. Viết gộp <code>global $a++;</code> là sai ngữ pháp và PHP báo lỗi ngay.<br><strong>Chi tiết kỹ thuật:</strong> <code>global</code> là câu lệnh khai báo, không thể chứa biểu thức toán học <code>++</code>.",

  23: "<strong>Hình dung đơn giản:</strong> Đoạn code bị 2 lỗi:<br>1. Biến <code>private $a</code> bị 'khóa riêng tư', bên ngoài không được sờ vào qua <code>$num->a</code>.<br>2. Hàm <code>__construct($b)</code> bắt buộc phải truyền 1 giá trị <code>$b</code>, nhưng khi tạo <code>new Number()</code> lại để trống $\\rightarrow$ <strong>Báo lỗi</strong>.<br><strong>Chi tiết kỹ thuật:</strong> Vi phạm quyền truy cập private và thiếu tham số constructor (ArgumentCountError).",

  24: "<strong>Hình dung đơn giản:</strong> Biến <code>$a</code> ban đầu bằng 5. Trong hàm <code>add()</code>, phép tính <code>return $a + $b</code> chỉ làm phép cộng để trả về kết quả (gán vào <code>$c = 8</code>), chứ không hề có lệnh gán thay đổi <code>$a</code>. Vì thế <code>$a</code> bên ngoài <strong>vẫn bằng 5</strong>.<br><strong>Chi tiết kỹ thuật:</strong> Phép cộng không thay đổi giá trị lưu trữ của biến <code>$a</code>.",

  25: "<strong>Hình dung đơn giản:</strong> Nhìn vào constructor: người viết gõ <code>$a = $b + 3;</code> (quên chữ <code>$this->a</code>). Vì quên <code>$this-></code> nên nó chỉ gán cho một biến tạm rồi biến mất khi hàm kết thúc. Thuộc tính <code>public $a = 5</code> của đối tượng không hề bị đổi, <strong>vẫn bằng 5</strong>.<br><strong>Chi tiết kỹ thuật:</strong> Để gán vào thuộc tính của class trong PHP, bắt buộc phải dùng <code>$this->a</code>.",

  26: "<strong>Hình dung đơn giản:</strong> Lệnh <code>Number::$a</code> truy cập trực tiếp biến static mà <strong>không hề tạo đối tượng (không dùng <code>new</code>)</strong>, nên hàm <code>__construct</code> chưa từng được chạy. Biến <code>$a</code> giữ nguyên giá trị ban đầu là <strong>5</strong>.<br><strong>Chi tiết kỹ thuật:</strong> Hàm constructor chỉ chạy khi khởi tạo một instance mới bằng <code>new</code>.",

  27: "<strong>Hình dung đơn giản:</strong> Chuỗi dùng 2 cặp dấu ngoặc kép liền nhau <code>\"\"Gia tri...\"\"</code> là sai cú pháp cơ bản trong PHP $\\rightarrow$ <strong>Lỗi chương trình (Parse Error)</strong>.<br><strong>Chi tiết kỹ thuật:</strong> Cú pháp chuỗi không hợp lệ gây lỗi cú pháp khi biên dịch.",

  28: "<strong>Hình dung đơn giản:</strong> Trong PHP chuẩn không có hàm nào tên là <code>html()</code> (chỉ có <code>htmlspecialchars</code>). Gọi một hàm không tồn tại sẽ làm chương trình bị sập $\\rightarrow$ <strong>Lỗi chương trình</strong>.<br><strong>Chi tiết kỹ thuật:</strong> Lỗi <em>Fatal error: Call to undefined function html()</em>.",

  29: "<strong>Hình dung đơn giản:</strong> Lệnh <code>unset($m)</code> đã xóa sổ mảng <code>$m</code> khỏi bộ nhớ. Dòng tiếp theo cố tình lấy phần tử từ mảng đã bị xóa <code>array_pop($m)</code> $\\rightarrow$ <strong>Lỗi chương trình</strong>.<br><strong>Chi tiết kỹ thuật:</strong> Không thể thao tác mảng trên một biến đã bị hủy (unset).",

  30: "<strong>Hình dung đơn giản:</strong> Constructor yêu cầu tham số <code>$b</code> (ví dụ: <code>new Number(5)</code>), nhưng khi gọi <code>new Number()</code> lại không truyền gì vào $\\rightarrow$ <strong>Lỗi chương trình</strong>.<br><strong>Chi tiết kỹ thuật:</strong> Thiếu tham số bắt buộc trong constructor.",

  31: "<strong>Hình dung đơn giản:</strong> Constructor viết <code>$a = $b + 3;</code> (quên <code>$this->a</code>), không gán được dữ liệu vào thuộc tính đối tượng $\\rightarrow$ <strong>Lỗi chương trình</strong>.<br><strong>Chi tiết kỹ thuật:</strong> Biến cục bộ trong constructor không cập nhật instance property.",

  32: "<strong>Hình dung đơn giản:</strong> Thuộc tính tĩnh static cần gán bằng <code>self::$a = ...</code>, nhưng code lại viết <code>$a = $b + 3;</code> $\\rightarrow$ <strong>Lỗi chương trình</strong>.<br><strong>Chi tiết kỹ thuật:</strong> Thiếu từ khóa <code>self::$a</code> khi cập nhật biến static.",

  33: "<strong>Hình dung đơn giản:</strong> Tương tự các câu trên, thiếu <code>$this->a</code> trong constructor $\\rightarrow$ <strong>Lỗi chương trình</strong>.<br><strong>Chi tiết kỹ thuật:</strong> Lỗi logic gán biến trong OOP PHP.",

  34: "<strong>Hình dung đơn giản:</strong> Đoạn mã gọi thuộc tính động <code>$num2->$a</code> (biến <code>$a</code> chưa có) nên PHP hiện cảnh báo (Warning), nhưng chương trình vẫn chạy tiếp và in ra thuộc tính <code>$num2->a</code> là 5.<br><strong>Chi tiết kỹ thuật:</strong> PHP phát cảnh báo nhưng không dừng luồng thực thi.",

  35: "<strong>Hình dung đơn giản:</strong> <strong>Controller</strong> đóng vai trò như 'anh bồi bàn': tiếp nhận yêu cầu gọi món từ khách hàng (View), chuyển vào bếp xử lý dữ liệu (Model), rồi mang kết quả ra giao diện cho khách (View). Controller là trung gian nói chuyện với cả 2 bên.<br><strong>Chi tiết kỹ thuật:</strong> Controller điều phối luồng dữ liệu giữa Model và View trong mô hình MVC.",

  36: "<strong>Hình dung đơn giản:</strong> Tầng <strong>Model</strong> là tầng quản lý Dữ liệu. Nó chứa các file PHP biểu diễn cấu trúc dữ liệu, các bảng trong database và các quy tắc xử lý nghiệp vụ.<br><strong>Chi tiết kỹ thuật:</strong> Model chịu trách nhiệm tương tác CSDL và logic dữ liệu của ứng dụng.",

  37: "<strong>Hình dung đơn giản:</strong> Mô hình MVC gồm 3 tầng viết tắt: <strong>M</strong>odel (Dữ liệu), <strong>V</strong>iew (Giao diện hiển thị), <strong>C</strong>ontroller (Bộ điều khiển logic).<br><strong>Chi tiết kỹ thuật:</strong> Bộ 3 cấu thành kiến trúc MVC.",

  38: "<strong>Hình dung đơn giản:</strong> Dấu <code>&</code> trong <code>add(&$b)</code> là 'truyền tham chiếu' (dùng chung ô nhớ với biến <code>$a</code> bên ngoài). Phép tính <code>$b++</code> làm tăng trực tiếp giá trị của <code>$a</code> từ 7 lên <strong>8</strong>.<br><strong>Chi tiết kỹ thuật:</strong> Tham số truyền theo tham chiếu sẽ làm thay đổi giá trị của biến gốc bên ngoài.",

  39: "<strong>Hình dung đơn giản:</strong> <code>global $a;</code> mang biến <code>$a</code> bên ngoài vào trong hàm. Câu lệnh <code>$a++;</code> làm tăng giá trị của <code>$a</code> từ 7 lên <strong>8</strong>.<br><strong>Chi tiết kỹ thuật:</strong> <code>global</code> cho phép sửa đổi biến toàn cục.",

  40: "<strong>Hình dung đơn giản:</strong> Khi gọi <code>add(4)</code>, số 4 được truyền vào cho biến <code>$b</code> (thay thế cho số 3 mặc định). Biến toàn cục <code>$a = 5</code>, do đó kết quả trả về là <code>$a + $b = 5 + 4 = 9</code>.<br><strong>Chi tiết kỹ thuật:</strong> Đối số truyền vào ghi đè giá trị tham số mặc định.",

  41: "<strong>Hình dung đơn giản:</strong> Mảng kết hợp <code>$m</code> có khóa <code>'a'</code> gắn với giá trị <code>'1'</code>. Khi gọi <code>$m['a']</code>, kết quả in ra là <strong>1</strong>.<br><strong>Chi tiết kỹ thuật:</strong> Truy xuất giá trị theo khóa trong mảng kết hợp.",

  42: "<strong>Hình dung đơn giản:</strong> <code>array_shift()</code> lấy ra phần tử đầu tiên của mảng (phần tử <code>'a'=>'1'</code>), giá trị của nó là <strong>1</strong>.<br><strong>Chi tiết kỹ thuật:</strong> <code>array_shift()</code> trả về giá trị của phần tử đầu tiên.",

  43: "<strong>Hình dung đơn giản:</strong><br>• Hàm <code>add($b)</code> truyền biến thường (bản sao), <code>return $b++</code> là toán tử hậu tố nên trả về giá trị ban đầu là <strong>3</strong>.<br>• Phép tính: <code>$a = 3 - 2 = 1</code>.<br><strong>Chi tiết kỹ thuật:</strong> Toán tử hậu tố <code>$b++</code> trả về giá trị trước khi tăng.",

  44: "<strong>Hình dung đơn giản:</strong> Tương tự câu 43, hàm <code>add(&$b)</code> trả về giá trị 3. Biểu thức <code>$a = 3 - 2</code> gán giá trị <strong>1</strong> vào biến <code>$a</code>.<br><strong>Chi tiết kỹ thuật:</strong> Kết quả phép tính <code>3 - 2 = 1</code> gán đè vào <code>$a</code>.",

  45: "<strong>Hình dung đơn giản:</strong> Tham số <code>$b</code> là biến thường (tham trị), tăng <code>$b</code> trong hàm chỉ thay đổi bản sao, không làm ảnh hưởng gì đến biến <code>$a</code> bên ngoài. Biến <code>$a</code> <strong>vẫn bằng 7</strong>.<br><strong>Chi tiết kỹ thuật:</strong> Truyền tham trị không làm thay đổi biến gốc.",

  46: "<strong>Hình dung đơn giản:</strong> Mảng siêu toàn cục chuẩn của PHP bắt buộc có chữ 'S' ở cuối (<code>$GLOBALS</code>). Viết thiếu chữ S thành <code>$GLOBAL</code> thì PHP phát cảnh báo, nhưng biến <code>$a</code> không đổi và vẫn in ra giá trị 7.<br><strong>Chi tiết kỹ thuật:</strong> Cú pháp đúng là <code>$GLOBALS['a']</code>.",

  47: "<strong>Hình dung đơn giản:</strong> <code>substr($mess, 0, 3)</code> nghĩa là: 'Từ vị trí đầu tiên (0), cắt lấy đúng 3 ký tự'. Ba ký tự đầu của chuỗi 'Gia tri...' chính là <strong>Gia</strong>.<br><strong>Chi tiết kỹ thuật:</strong> Hàm cắt chuỗi con <code>substr(chuỗi, bắt_đầu, độ_dài)</code>.",

  48: "<strong>Hình dung đơn giản:</strong><br>• Dấu nháy kép <code>\"...$a\"</code>: PHP sẽ thay <code>$a</code> bằng số 5.<br>• Dấu nháy đơn <code>'...$a'</code>: PHP <strong>không thay thế biến</strong>, giữ nguyên chữ thô $\\rightarrow$ in ra <strong>Gia tri cua a la: $a</strong>.<br><strong>Chi tiết kỹ thuật:</strong> Nháy đơn không thực hiện nội suy biến (Variable Interpolation).",

  49: "<strong>Hình dung đơn giản:</strong> Chuỗi trong nháy kép đổi thành 'Gia tri cua a la: 5'. Sau đó hàm <code>str_replace('a', 'b', ...)</code> tìm chữ 'a' và thay bằng chữ 'b' $\\rightarrow$ thành <strong>Gia tri cua b la: 5</strong>.<br><strong>Chi tiết kỹ thuật:</strong> Hàm thay thế chuỗi <code>str_replace(tìm, thay_thế, nguồn)</code>.",

  50: "<strong>Hình dung đơn giản:</strong> <code>\\xa9</code> là mã hexa của biểu tượng bản quyền <strong>©</strong>. Biến <code>$a</code> trong nháy kép được đổi thành 5 $\\rightarrow$ in ra <strong>©Gia tri cua a la: 5</strong>.<br><strong>Chi tiết kỹ thuật:</strong> Ký tự escape Hexadecimal <code>\\xa9</code> = ©.",

  51: "<strong>Hình dung đơn giản:</strong> Ép kiểu chuỗi sang số nguyên <code>(int)</code>: PHP đọc từ trái sang phải, gặp ngay chữ 'G' (không phải con số) nên PHP tự động chuyển giá trị về số <strong>0</strong>.<br><strong>Chi tiết kỹ thuật:</strong> Chuỗi bắt đầu bằng chữ cái khi ép kiểu <code>(int)</code> sẽ có giá trị là 0.",

  52: "<strong>Hình dung đơn giản:</strong> Mảng thời gian của <code>getdate()</code> chỉ có khóa <code>'mday'</code> (ngày trong tháng) hoặc <code>'wday'</code> (ngày trong tuần), <strong>không có khóa <code>'day'</code></strong>. Tìm khóa không tồn tại nên chương trình không in ra gì.<br><strong>Chi tiết kỹ thuật:</strong> Khóa hợp lệ của <code>getdate()</code> là <code>mday</code>.",

  53: "<strong>Hình dung đơn giản:</strong> Cú pháp <code>mktime(giờ, phút, giây, tháng, ngày, năm)</code>. Tham số thứ tư là số 4 (tháng 4). Mảng <code>getdate()</code> có khóa <code>'month'</code> trả về tên tiếng Anh của tháng đó là <strong>April</strong>.<br><strong>Chi tiết kỹ thuật:</strong> <code>getdate()['month']</code> trả về tên tháng đầy đủ bằng tiếng Anh.",

  54: "<strong>Hình dung đơn giản:</strong> Khóa chỉ giờ trong <code>getdate()</code> là <code>'hours'</code> (có chữ s), chứ không phải <code>'hour'</code>.<br><strong>Chi tiết kỹ thuật:</strong> Khóa sai tên nên không lấy được dữ liệu.",

  55: "<strong>Hình dung đơn giản:</strong> Lệnh <code>window.open(...)</code> trong JavaScript dùng để mở một trang web mới trong cửa sổ hoặc tab mới của trình duyệt.<br><strong>Chi tiết kỹ thuật:</strong> Phương thức <code>window.open(url, target)</code> mở URL mới.",

  56: "<strong>Hình dung đơn giản:</strong> <code>try...catch</code> giống như 'lưới bảo hiểm': bọc đoạn code có thể bị lỗi vào <code>try</code>, nếu xảy ra sự cố thì <code>catch</code> sẽ bắt lấy và xử lý êm đẹp để trang web không bị sập.<br><strong>Chi tiết kỹ thuật:</strong> Bắt và xử lý ngoại lệ (Exception Handling) trong PHP.",

  57: "<strong>Hình dung đơn giản:</strong> Hàm không cần trả về dữ liệu (hàm void) thì chỉ cần <strong>không viết lệnh return</strong> trong thân hàm.<br><strong>Chi tiết kỹ thuật:</strong> Hàm không có lệnh return sẽ tự động kết thúc khi chạy hết các dòng lệnh.",

  58: "<strong>Hình dung đơn giản:</strong> Cấu trúc lựa chọn (rẽ nhánh điều kiện) trong lập trình gồm có: <code>if / else</code>, toán tử 3 ngôi (<code>? :</code>), và <code>switch case</code>.<br><strong>Chi tiết kỹ thuật:</strong> Ba cấu trúc điều kiện cơ bản trong lập trình.",

  59: "<strong>Hình dung đơn giản:</strong> JavaScript là 'bộ não tạo hiệu ứng': nó giúp trang web tạo các chuyển động mượt mà như trình chiếu ảnh (slider/carousel), chuyển tab, mở popup modal...<br><strong>Chi tiết kỹ thuật:</strong> JS thao tác DOM tạo hiệu ứng tương tác trực quan.",

  60: "<strong>Hình dung đơn giản:</strong> JavaScript giúp tạo menu thả xuống (dropdown menu) khi người dùng bấm hoặc rê chuột vào thanh điều hướng.<br><strong>Chi tiết kỹ thuật:</strong> JS thay đổi thuộc tính CSS/DOM để ẩn hiện menu con.",

  61: "<strong>Hình dung đơn giản:</strong> JavaScript chuyên xử lý các sự kiện của người dùng như: click chuột, rê chuột qua ảnh để đổi hình, ẩn/hiện nội dung...<br><strong>Chi tiết kỹ thuật:</strong> Event Handling trong JavaScript.",

  62: "<strong>Hình dung đơn giản:</strong> Sự kiện <code>onclick</code> xảy ra khi người dùng <strong>bấm (click) chuột</strong> vào một nút lệnh hoặc phần tử trên màn hình.<br><strong>Chi tiết kỹ thuật:</strong> Kích hoạt khi có thao tác chuột nhấn và nhả trên element.",

  63: "<strong>Hình dung đơn giản:</strong> Sự kiện <code>onblur</code> xảy ra khi ô nhập liệu <strong>bị mất tiêu điểm</strong> (người dùng bấm chuột ra ngoài ô đó).<br><strong>Chi tiết kỹ thuật:</strong> Kích hoạt khi phần tử form mất focus.",

  64: "<strong>Hình dung đơn giản:</strong> Sự kiện <code>onchange</code> xảy ra khi <strong>giá trị bên trong ô nhập liệu bị người dùng thay đổi</strong>.<br><strong>Chi tiết kỹ thuật:</strong> Kích hoạt khi value của input/select/textarea thay đổi và mất focus.",

  65: "<strong>Hình dung đơn giản:</strong> Sự kiện <code>onmouseover</code> kích hoạt ngay khi bạn <strong>rê con trỏ chuột vào</strong> vùng của một phần tử.<br><strong>Chi tiết kỹ thuật:</strong> Kích hoạt khi con trỏ chuột đi vào phạm vi của element.",

  66: "<strong>Hình dung đơn giản:</strong> Sự kiện <code>onunload</code> kích hoạt khi người dùng <strong>đóng trang web hoặc kết thúc phiên duyệt trang</strong>.<br><strong>Chi tiết kỹ thuật:</strong> Kích hoạt khi tài liệu HTML bị dỡ khỏi trình duyệt.",

  67: "<strong>Hình dung đơn giản:</strong> HTML tạo khung xương, CSS làm đẹp, còn JavaScript được sinh ra để tạo <strong>tính tương tác linh hoạt</strong> cho trang web.<br><strong>Chi tiết kỹ thuật:</strong> JavaScript mang lại tính tương tác hai chiều giữa người dùng và trang web.",

  68: "<strong>Hình dung đơn giản:</strong> External Stylesheet là cách viết CSS ra một file riêng biệt có đuôi mở rộng là <code>.css</code> rồi gắn vào HTML.<br><strong>Chi tiết kỹ thuật:</strong> Tạo file <code>.css</code> độc lập để dễ quản lý và tái sử dụng.",

  69: "<strong>Hình dung đơn giản:</strong> CSS có thể làm đẹp mọi thứ: đổi font/cỡ chữ (kiểu chữ), đổi màu nền/màu chữ (màu sắc), và sắp xếp vị trí các khối (định vị/bố cục).<br><strong>Chi tiết kỹ thuật:</strong> CSS tác động lên typography, color, và positioning/layout.",

  70: "<strong>Hình dung đơn giản:</strong> Nhờ các bộ chọn (Selector như class, id, tag), CSS có thể áp dụng phong cách chọn lọc lên bất kỳ thành phần nào trên trang.<br><strong>Chi tiết kỹ thuật:</strong> CSS Selectors cho phép định kiểu chính xác từng element.",

  71: "<strong>Hình dung đơn giản:</strong> Để nối file CSS bên ngoài vào trang web, ta dùng thẻ <code><link rel=\"stylesheet\" href=\"style.css\"></code> đặt trong phần <code><head></code>.<br><strong>Chi tiết kỹ thuật:</strong> Thẻ <code><link></code> với thuộc tính <code>rel=\"stylesheet\"</code>.",

  72: "<strong>Hình dung đơn giản:</strong> Inline CSS (nội tuyến) là cách viết mã CSS trực tiếp ngay bên trong thẻ HTML bằng thuộc tính <code>style=\"...\"</code>.<br><strong>Chi tiết kỹ thuật:</strong> Ví dụ: <code>&lt;p style=\"color: red;\"&gt;</code>.",

  73: "<strong>Hình dung đơn giản:</strong> Internal CSS (nội bộ) là viết CSS bên trong cặp thẻ <code><style> ... </style></code> nằm trong tệp HTML.<br><strong>Chi tiết kỹ thuật:</strong> Khối <code>&lt;style&gt;</code> thường đặt trong phần <code>&lt;head&gt;</code>.",

  74: "<strong>Hình dung đơn giản:</strong> Một trong những phương thức đặt CSS cơ bản là <strong>external style</strong> (tách ra file CSS bên ngoài).<br><strong>Chi tiết kỹ thuật:</strong> 3 cách đặt CSS: External, Internal, Inline.",

  75: "<strong>Hình dung đơn giản:</strong> Một Style Sheet (bảng định kiểu) được tạo thành từ tập hợp của nhiều <strong>CSS Rule</strong> (Quy tắc CSS).<br><strong>Chi tiết kỹ thuật:</strong> Mỗi CSS Rule gồm Selector và Declaration Block.",

  76: "<strong>Hình dung đơn giản:</strong> <strong>Tính kế thừa (Inheritance)</strong> là đặc tính mà thẻ con sẽ tự động được thừa hưởng các định dạng (như màu chữ, kiểu font) từ thẻ cha bao bọc nó.<br><strong>Chi tiết kỹ thuật:</strong> Tính kế thừa giúp giảm trùng lặp mã CSS.",

  77: "<strong>Hình dung đơn giản:</strong> Khi trang web có cả màu nền và hình nền: màu nền sẽ hiện lên trước làm lớp lót trong lúc trình duyệt đang tải tệp hình nền từ trên mạng về.<br><strong>Chi tiết kỹ thuật:</strong> <code>background-color</code> render trước để tối ưu trải nghiệm khi ảnh đang load.",

  78: "<strong>Hình dung đơn giản:</strong> Thẻ <code><div></code> là viết tắt của từ <strong>division</strong> (nghĩa là phân chia / phân vùng khối nội dung).<br><strong>Chi tiết kỹ thuật:</strong> Thẻ khối (block-level element) phổ biến nhất trong HTML.",

  79: "<strong>Hình dung đơn giản:</strong> Trong cây cấu trúc HTML chuẩn, cặp thẻ <code><head></head></code> luôn nằm bên trong cặp thẻ gốc <strong><code><html></html></code></strong>.<br><strong>Chi tiết kỹ thuật:</strong> Thẻ <code>&lt;html&gt;</code> chứa <code>&lt;head&gt;</code> và <code>&lt;body&gt;</code>.",

  80: "<em>Lưu ý thi trắc nghiệm:</em> Trong ngân hàng đề thi trường, đáp án được quy ước là: <em>Tạo một textbox cho phép nhập liệu nhiều dòng.</em><br><strong>Kiến thức thực tế chuẩn W3C/MDN:</strong> Thẻ <code>&lt;input type='password'&gt;</code> dùng để tạo ô nhập mật khẩu 1 dòng (ẩn ký tự bằng dấu chấm/sao).",

  81: "<em>Lưu ý thi trắc nghiệm:</em> Trong ngân hàng đề thi trường, đáp án quy ước là: <em>Tạo một nút lệnh dùng để gửi tin trong form đi.</em><br><strong>Kiến thức thực tế chuẩn W3C/MDN:</strong> Thẻ <code>&lt;input type='text'&gt;</code> dùng để tạo ô nhập văn bản thuần 1 dòng.",

  82: "<em>Lưu ý thi trắc nghiệm:</em> Trong ngân hàng đề thi trường, đáp án quy ước là: <em>Tạo một ô password.</em><br><strong>Kiến thức thực tế chuẩn W3C/MDN:</strong> Thẻ <code>&lt;textarea&gt;</code> dùng để tạo khung nhập văn bản nhiều dòng.",

  83: "<strong>Hình dung đơn giản:</strong> HTML hỗ trợ định dạng màu sắc thuần / màu đơn sắc (gọi là <strong>Màu bệt - flat color</strong>) thông qua mã màu Hex (<code>#ff0000</code>), RGB, hoặc tên màu.<br><strong>Chi tiết kỹ thuật:</strong> Màu bệt (flat color) là màu sắc đồng nhất không có hiệu ứng chuyển màu gradient.",

  84: "<em>Lưu ý thi trắc nghiệm:</em> Trong ngân hàng đề thi trường, đáp án quy ước là: <em>Tạo một ô text để nhập dữ liệu 1 dòng.</em><br><strong>Kiến thức thực tế chuẩn W3C/MDN:</strong> Thẻ <code>&lt;input type='submit'&gt;</code> dùng để tạo nút bấm gửi (submit) dữ liệu form lên server.",

  85: "<strong>Hình dung đơn giản:</strong> Muốn trang PHP tự động chuyển hướng người dùng sang một trang web khác, ta dùng hàm <strong><code>header(\"Location: url\")</code></strong>.<br><strong>Chi tiết kỹ thuật:</strong> Gửi HTTP Header chuyển hướng trình duyệt.",

  86: "<strong>Hình dung đơn giản:</strong> Chế độ <strong>Live Code</strong> trong các phần mềm soạn thảo web (như Dreamweaver) cho phép bạn nhìn thấy mã nguồn HTML/PHP được cập nhật trực tiếp theo thời gian thực.<br><strong>Chi tiết kỹ thuật:</strong> Hiển thị mã nguồn song song với giao diện xem trước.",

  87: "<strong>Hình dung đơn giản:</strong> Để nhúng và sử dụng lại nội dung từ file PHP này sang file PHP khác, ta dùng lệnh <strong><code>include</code></strong> (hoặc <code>require</code>).<br><strong>Chi tiết kỹ thuật:</strong> Lệnh <code>include 'file.php'</code> nạp mã nguồn từ file khác.",

  88: "<strong>Hình dung đơn giản:</strong> Cú pháp chuyển hướng trang trong PHP là <code>header(\"Location: .\")</code> (dấu chấm biểu thị thư mục hiện tại).<br><strong>Chi tiết kỹ thuật:</strong> Cú pháp chuẩn của hàm header chuyển hướng.",

  89: "<strong>Hình dung đơn giản:</strong> Bộ ba công nghệ nền tảng của Web: <strong>HTML</strong> (xây dựng khung xương) + <strong>CSS</strong> (trang trí diện mạo) + <strong>JavaScript</strong> (tạo chuyển động và hành vi).<br><strong>Chi tiết kỹ thuật:</strong> JS là 1 trong 3 công nghệ cốt lõi của Web bên cạnh HTML và CSS.",

  90: "<strong>Hình dung đơn giản:</strong> JavaScript là một ngôn ngữ lập trình thực sự, giúp bạn viết code để tính toán số liệu, xử lý logic và bắt sự kiện người dùng trên web.<br><strong>Chi tiết kỹ thuật:</strong> JS là ngôn ngữ lập trình kịch bản hướng đối tượng.",

  91: "<strong>Hình dung đơn giản:</strong> Mục đích ban đầu của JavaScript khi ra đời là chạy trên trình duyệt (phía Client / máy người dùng) để trang web phản hồi nhanh mà không cần gửi về máy chủ.<br><strong>Chi tiết kỹ thuật:</strong> Client-side scripting language.",

  92: "<strong>Hình dung đơn giản:</strong> JavaScript hoàn toàn có thể dùng để lập trình các trò chơi (games) 2D/3D chạy mượt mà trực tiếp trên trình duyệt nhờ HTML5 Canvas và WebGL.<br><strong>Chi tiết kỹ thuật:</strong> JS hỗ trợ đồ họa Canvas và WebGL mạnh mẽ.",

  93: "<strong>Hình dung đơn giản:</strong> Một ứng dụng cực kỳ phổ biến của JavaScript là <strong>kiểm tra tính hợp lệ của dữ liệu biểu mẫu (Form Validation)</strong> (ví dụ: kiểm tra xem người dùng đã nhập đúng email chưa trước khi gửi).<br><strong>Chi tiết kỹ thuật:</strong> Form Validation giúp giảm tải cho server.",

  94: "<strong>Hình dung đơn giản:</strong> Một quy tắc CSS (CSS Rule) bao gồm bộ chọn (Selector) và khối khai báo chứa nhiều <strong>Thuộc tính (Properties)</strong> (như color, font-size, width...).<br><strong>Chi tiết kỹ thuật:</strong> Cấu trúc của CSS rule gồm các thuộc tính và giá trị tương ứng.",

  95: "<strong>Hình dung đơn giản:</strong> Trạng thái <strong><code>a:hover</code></strong> là trạng thái phổ biến nhất của liên kết, kích hoạt khi người dùng <strong>rê chuột lên liên kết đó</strong>.<br><strong>Chi tiết kỹ thuật:</strong> Pseudo-class <code>:hover</code> dùng để định kiểu khi hover.",

  96: "<strong>Hình dung đơn giản:</strong> Ngôn ngữ web được chia làm <strong>2 loại chính</strong>:<br>1. Phía máy khách (Client-side): chạy trên trình duyệt của bạn (như JavaScript).<br>2. Phía máy chủ (Server-side): chạy trên máy chủ chứa web (như PHP, Python, Node.js).<br><strong>Chi tiết kỹ thuật:</strong> Phân loại kiến trúc Client-side và Server-side.",

  97: "<strong>Hình dung đơn giản:</strong> Khi gọi một hàm, các giá trị bạn truyền vào phải <strong>đúng theo thứ tự</strong> các tham số đã được định nghĩa trong hàm thì máy mới hiểu đúng.<br><strong>Chi tiết kỹ thuật:</strong> Thứ tự đối số (arguments) phải khớp với thứ tự tham số (parameters).",

  98: "<strong>Hình dung đơn giản:</strong> Sức mạnh lớn nhất của CSS là bạn chỉ cần viết một file CSS duy nhất là có thể áp dụng phong cách đồng bộ, nhất quán cho hàng nghìn trang web trong toàn bộ hệ thống.<br><strong>Chi tiết kỹ thuật:</strong> Tái sử dụng và nhất quán giao diện toàn trang.",

  99: "<strong>Hình dung đơn giản:</strong> CSS là ngôn ngữ định kiểu kết hợp với HTML để tạo màu sắc, kích thước, khoảng cách và diện mạo đẹp mắt cho nội dung trang web.<br><strong>Chi tiết kỹ thuật:</strong> CSS định dạng cho cấu trúc HTML.",

  100: "<strong>Hình dung đơn giản:</strong> 'Phân công nhiệm vụ' của bộ 3 Web:<br>• <strong>HTML</strong>: Bố trí khung thông tin.<br>• <strong>CSS</strong>: Trang trí, định dạng thông tin.<br>• <strong>JavaScript</strong>: Tính toán và tạo hành động theo tình huống.<br><strong>Chi tiết kỹ thuật:</strong> Ba trụ cột của phát triển Web Frontend.",

  101: "<strong>Hình dung đơn giản:</strong> <strong>Địa chỉ IP</strong> giống như 'địa chỉ số nhà dạng số' (như <code>192.168.1.1</code>) của một máy tính hay máy chủ, giúp các thiết bị trên toàn thế giới có thể tìm thấy và gửi dữ liệu cho nhau qua Internet.<br><strong>Chi tiết kỹ thuật:</strong> IP Address (Internet Protocol) là định danh số duy nhất trên mạng."
};

const enrichedQuestions = rawQuestions.map(q => {
  return {
    id: q.id,
    question: q.question,
    correct: q.correct,
    wrongs: q.wrongs,
    tip: q.tip || '',
    distinguish: q.distinguish || '',
    explanation: technicalExplanations[q.id] || ('Đáp án chính xác là <strong>' + q.correct + '</strong> theo chuẩn cú pháp và lý thuyết Web.')
  };
});

console.log('Enriched questions count:', enrichedQuestions.length);

// Escape script closing tags to prevent early termination in browser HTML parser
const safeQuestionsJson = JSON.stringify(enrichedQuestions).replace(/<\/script/gi, '<\\/script');

// Generate standalone HTML with 100vh Widescreen 2-column Layout
const html = `<!DOCTYPE html>
<html lang="vi" data-theme="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Hệ Thống Ôn Thi Trắc Nghiệm Web - 101 Câu Hỏi</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <!-- Lucide Icons Script -->
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    /* ========== THEME PALETTES ========== */
    :root {
      /* Dark Theme (Default) */
      --bg-main: #090a0c;
      --bg-surface: #121316;
      --bg-surface-elevated: #181a1f;
      --bg-surface-hover: #20232a;
      
      --border-subtle: #23262d;
      --border-medium: #323640;
      --border-focus: #70b4ff;
      
      --text-primary: #f3f4f6;
      --text-secondary: #9ca3af;
      --text-tertiary: #6b7280;
      --text-brand: #8ecbff;
      
      --brand-primary: #70b4ff;
      --brand-glow: rgba(112, 180, 255, 0.12);
      --brand-border: rgba(112, 180, 255, 0.35);
      
      --color-success: #34d399;
      --color-success-bg: rgba(52, 211, 153, 0.1);
      --color-success-border: rgba(52, 211, 153, 0.35);
      
      --color-danger: #f87171;
      --color-danger-bg: rgba(248, 113, 113, 0.1);
      --color-danger-border: rgba(248, 113, 113, 0.35);

      --code-bg: #090a0c;
      --code-color: #93c5fd;
      --shadow-card: 0 4px 20px rgba(0, 0, 0, 0.35);
      --modal-overlay-bg: rgba(0, 0, 0, 0.75);

      --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }

    [data-theme="light"] {
      /* Light Theme */
      --bg-main: #f8fafc;
      --bg-surface: #ffffff;
      --bg-surface-elevated: #f1f5f9;
      --bg-surface-hover: #e2e8f0;
      
      --border-subtle: #e2e8f0;
      --border-medium: #cbd5e1;
      --border-focus: #3b82f6;
      
      --text-primary: #0f172a;
      --text-secondary: #475569;
      --text-tertiary: #94a3b8;
      --text-brand: #0284c7;
      
      --brand-primary: #0284c7;
      --brand-glow: rgba(2, 132, 199, 0.08);
      --brand-border: rgba(2, 132, 199, 0.28);
      
      --color-success: #059669;
      --color-success-bg: rgba(16, 185, 129, 0.08);
      --color-success-border: rgba(16, 185, 129, 0.3);
      
      --color-danger: #dc2626;
      --color-danger-bg: rgba(239, 68, 68, 0.08);
      --color-danger-border: rgba(239, 68, 68, 0.25);

      --code-bg: #f1f5f9;
      --code-color: #0369a1;
      --shadow-card: 0 4px 16px rgba(0, 0, 0, 0.06);
      --modal-overlay-bg: rgba(15, 23, 42, 0.45);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html, body {
      height: 100vh;
      height: 100dvh;
      overflow: hidden;
      background-color: var(--bg-main);
      color: var(--text-primary);
      font-family: var(--font-sans);
      font-size: 14px;
      line-height: 1.55;
      -webkit-font-smoothing: antialiased;
      transition: background-color 0.22s ease, color 0.22s ease;
    }

    .mono {
      font-family: var(--font-mono);
    }

    /* App Container: Expanded Width to 1020px and exact 100vh height */
    .app-container {
      max-width: 1020px;
      width: 100%;
      height: 100vh;
      height: 100dvh;
      margin: 0 auto;
      padding: 14px 18px;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }

    /* Header */
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 12px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--border-subtle);
      flex-shrink: 0;
    }

    .header-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .badge-tag {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--text-brand);
      font-family: var(--font-mono);
      background: var(--brand-glow);
      padding: 3px 8px;
      border-radius: 5px;
      border: 1px solid var(--brand-border);
    }

    .header-title {
      font-size: 17px;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -0.02em;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 7px;
      font-size: 12.5px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.18s ease;
      background: var(--bg-surface);
      color: var(--text-secondary);
      border: 1px solid var(--border-subtle);
      user-select: none;
      text-decoration: none;
    }

    .btn:hover {
      background: var(--bg-surface-hover);
      color: var(--text-primary);
      border-color: var(--border-medium);
    }

    .btn:active {
      transform: translateY(1px);
    }

    .btn-brand {
      background: var(--brand-glow);
      color: var(--text-brand);
      border-color: var(--brand-border);
    }

    .btn-brand:hover {
      background: rgba(112, 180, 255, 0.22);
      border-color: var(--brand-primary);
      color: var(--text-brand);
    }

    [data-theme="light"] .btn-brand:hover {
      background: rgba(2, 132, 199, 0.15);
      border-color: var(--brand-primary);
    }

    /* Main Grid: 2 Columns on Desktop */
    .main-layout {
      flex: 1;
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 14px;
      min-height: 0; /* Crucial for internal scroll containment */
    }

    /* Left Sidebar: Score & Question Palette */
    .sidebar-panel {
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-height: 0;
    }

    /* Stats Card */
    .stats-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      padding: 12px 14px;
      box-shadow: var(--shadow-card);
      flex-shrink: 0;
    }

    .stats-grid {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }

    .stat-items-group {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .stat-icon {
      color: var(--text-tertiary);
      display: flex;
      align-items: center;
    }

    .stat-label {
      font-size: 10.5px;
      color: var(--text-secondary);
    }

    .stat-value {
      font-size: 13.5px;
      font-weight: 600;
      color: var(--text-primary);
      font-family: var(--font-mono);
    }

    .stat-value-sub {
      color: var(--text-tertiary);
      font-weight: 400;
      font-size: 11px;
    }

    .percentage-badge {
      font-family: var(--font-mono);
      font-size: 13px;
      font-weight: 700;
      color: var(--text-brand);
      background: var(--brand-glow);
      padding: 3px 8px;
      border-radius: 5px;
      border: 1px solid var(--brand-border);
    }

    /* Progress bar */
    .progress-track {
      width: 100%;
      height: 5px;
      background: var(--bg-surface-elevated);
      border-radius: 99px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #38bdf8, #8ecbff);
      border-radius: 99px;
      transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    }

    [data-theme="light"] .progress-fill {
      background: linear-gradient(90deg, #0284c7, #38bdf8);
    }

    /* Palette Box */
    .palette-box {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      padding: 12px;
      box-shadow: var(--shadow-card);
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    .palette-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      margin-bottom: 10px;
      flex-shrink: 0;
    }

    .palette-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .palette-filters {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .filter-chip {
      background: transparent;
      border: 1px solid var(--border-subtle);
      color: var(--text-tertiary);
      padding: 2px 6px;
      border-radius: 5px;
      font-size: 10.5px;
      font-family: var(--font-mono);
      cursor: pointer;
      transition: all 0.15s;
    }

    .filter-chip:hover {
      border-color: var(--border-medium);
      color: var(--text-secondary);
    }

    .filter-chip.active {
      background: var(--bg-surface-elevated);
      border-color: var(--brand-border);
      color: var(--text-brand);
      font-weight: 600;
    }

    /* 101 Question Chips Grid */
    .chips-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 5px;
      overflow-y: auto;
      padding-right: 4px;
      flex: 1;
      min-height: 0;
    }

    .chips-grid::-webkit-scrollbar {
      width: 4px;
    }
    .chips-grid::-webkit-scrollbar-track {
      background: transparent;
    }
    .chips-grid::-webkit-scrollbar-thumb {
      background: var(--border-medium);
      border-radius: 4px;
    }

    .q-chip {
      height: 31px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      font-size: 11px;
      font-family: var(--font-mono);
      border: 1px solid var(--border-subtle);
      background: var(--bg-surface-elevated);
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .q-chip:hover {
      border-color: var(--border-medium);
      color: var(--text-primary);
      background: var(--bg-surface-hover);
    }

    .q-chip.active {
      border-color: var(--brand-primary) !important;
      color: var(--text-primary) !important;
      background: var(--brand-glow) !important;
      font-weight: 700;
      box-shadow: 0 0 0 1px var(--brand-primary);
    }

    .q-chip.correct {
      border-color: var(--color-success-border);
      background: var(--color-success-bg);
      color: var(--color-success);
    }

    .q-chip.wrong {
      border-color: var(--color-danger-border);
      background: var(--color-danger-bg);
      color: var(--color-danger);
    }

    /* Right Main Content Panel: Question & Workspace */
    .workspace-panel {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 16px 20px;
      box-shadow: var(--shadow-card);
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
    }

    .card-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
      flex-shrink: 0;
    }

    .q-index-pill {
      font-family: var(--font-mono);
      font-size: 11.5px;
      color: var(--text-brand);
      background: var(--brand-glow);
      padding: 3px 9px;
      border-radius: 5px;
      border: 1px solid var(--brand-border);
      font-weight: 600;
    }

    .q-reset-btn {
      background: none;
      border: none;
      color: var(--text-tertiary);
      font-size: 11.5px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      transition: color 0.15s;
    }

    .q-reset-btn:hover {
      color: var(--text-secondary);
    }

    /* Scrollable Question, Options & Explanation Area */
    .scroll-content {
      flex: 1;
      overflow-y: auto;
      padding-right: 6px;
      min-height: 0;
    }

    .scroll-content::-webkit-scrollbar {
      width: 5px;
    }
    .scroll-content::-webkit-scrollbar-track {
      background: transparent;
    }
    .scroll-content::-webkit-scrollbar-thumb {
      background: var(--border-medium);
      border-radius: 4px;
    }

    .question-content {
      font-size: 15.5px;
      font-weight: 500;
      color: var(--text-primary);
      margin-bottom: 16px;
      white-space: pre-wrap;
      line-height: 1.65;
      font-family: var(--font-sans);
    }

    /* Options List */
    .options-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 14px;
    }

    .option-btn {
      width: 100%;
      text-align: left;
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      padding: 10px 14px;
      display: flex;
      align-items: flex-start;
      gap: 10px;
      cursor: pointer;
      transition: all 0.16s ease;
      color: var(--text-primary);
      font-size: 13.5px;
      font-family: inherit;
    }

    .option-btn:hover:not(:disabled) {
      border-color: var(--border-medium);
      background: var(--bg-surface-hover);
      transform: translateX(2px);
    }

    .option-letter {
      width: 22px;
      height: 22px;
      border-radius: 5px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-mono);
      font-size: 11.5px;
      font-weight: 600;
      color: var(--text-secondary);
      flex-shrink: 0;
      margin-top: 1px;
    }

    .option-text {
      flex: 1;
      font-family: var(--font-mono);
      font-size: 13px;
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.45;
    }

    .option-icon {
      flex-shrink: 0;
      margin-top: 2px;
      display: flex;
      align-items: center;
    }

    /* Option States */
    .option-btn.state-correct {
      background: var(--color-success-bg) !important;
      border-color: var(--color-success-border) !important;
      color: var(--color-success);
      font-weight: 500;
    }
    .option-btn.state-correct .option-letter {
      background: var(--color-success);
      color: #fff;
      border-color: var(--color-success);
    }

    .option-btn.state-wrong {
      background: var(--color-danger-bg) !important;
      border-color: var(--color-danger-border) !important;
      color: var(--color-danger);
    }
    .option-btn.state-wrong .option-letter {
      background: var(--color-danger);
      color: #fff;
      border-color: var(--color-danger);
    }

    .option-btn.state-dim {
      opacity: 0.45;
      cursor: default;
    }

    /* Explanation Box */
    .explanation-panel {
      margin-top: 14px;
      padding-top: 14px;
      border-top: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      gap: 10px;
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .status-banner {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 6px;
      width: fit-content;
    }

    .status-banner.is-correct {
      background: var(--color-success-bg);
      color: var(--color-success);
      border: 1px solid var(--color-success-border);
    }

    .status-banner.is-wrong {
      background: var(--color-danger-bg);
      color: var(--color-danger);
      border: 1px solid var(--color-danger-border);
    }

    .explain-block {
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      padding: 11px 13px;
      display: flex;
      gap: 10px;
      align-items: flex-start;
    }

    .explain-icon {
      color: var(--text-brand);
      flex-shrink: 0;
      margin-top: 2px;
      display: flex;
      align-items: center;
    }

    .explain-icon.tip-icon {
      color: #f59e0b;
    }

    .explain-icon.diff-icon {
      color: #8b5cf6;
    }

    .explain-text-wrap {
      flex: 1;
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.55;
    }

    .explain-title {
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 4px;
      font-size: 12.5px;
    }

    .explain-text-wrap code {
      font-family: var(--font-mono);
      background: var(--code-bg);
      padding: 2px 5px;
      border-radius: 4px;
      font-size: 12px;
      color: var(--code-color);
      border: 1px solid var(--border-subtle);
    }

    /* Fixed Bottom Footer inside Workspace */
    .workspace-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid var(--border-subtle);
      flex-shrink: 0;
    }

    .nav-btn {
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 500;
    }

    .nav-btn:disabled {
      opacity: 0.35;
      cursor: not-allowed;
      pointer-events: none;
    }

    .shortcuts-hint {
      font-size: 11.5px;
      color: var(--text-tertiary);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .kbd {
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: 4px;
      padding: 2px 5px;
      font-family: var(--font-mono);
      font-size: 10.5px;
      color: var(--text-secondary);
    }

    /* Modal dialog */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--modal-overlay-bg);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      padding: 20px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
    }

    .modal-overlay.open {
      opacity: 1;
      pointer-events: auto;
    }

    .modal-box {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      max-width: 420px;
      width: 100%;
      padding: 22px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.4);
    }

    .modal-title {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 8px;
      color: var(--text-primary);
    }

    .modal-desc {
      font-size: 13px;
      color: var(--text-secondary);
      margin-bottom: 18px;
      line-height: 1.5;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    /* Responsive for Tablet / Mobile */
    @media (max-width: 768px) {
      html, body {
        overflow-y: auto;
        height: auto;
      }
      .app-container {
        height: auto;
        padding: 12px;
      }
      .main-layout {
        grid-template-columns: 1fr;
        height: auto;
      }
      .sidebar-panel {
        height: auto;
      }
      .chips-grid {
        max-height: 140px;
        grid-template-columns: repeat(auto-fill, minmax(34px, 1fr));
      }
      .workspace-panel {
        height: auto;
      }
      .scroll-content {
        overflow-y: visible;
      }
    }
  </style>
</head>
<body>

  <div class="app-container">
    <!-- Header -->
    <header>
      <div class="header-info">
        <div class="badge-tag">
          <i data-lucide="sparkles" style="width:13px; height:13px;"></i>
          Ôn Tập Web
        </div>
        <h1 class="header-title">Hệ Thống Luyện Thi 101 Câu Hỏi</h1>
      </div>
      <div class="header-actions">
        <!-- Theme Toggle Button -->
        <button id="btn-theme-toggle" class="btn" title="Chuyển đổi giao diện Sáng / Tối">
          <i id="theme-icon" data-lucide="sun" style="width:13px; height:13px;"></i>
          <span id="theme-text">Sáng</span>
        </button>

        <button id="btn-shuffle" class="btn" title="Xáo trộn vị trí các đáp án A/B/C/D">
          <i data-lucide="shuffle" style="width:13px; height:13px;"></i>
          <span>Xáo đáp án</span>
        </button>
        <button id="btn-reset-all" class="btn" title="Làm lại toàn bộ 101 câu">
          <i data-lucide="rotate-ccw" style="width:13px; height:13px;"></i>
          <span>Làm lại</span>
        </button>
      </div>
    </header>

    <!-- Main 2-Column Dashboard Layout (100vh) -->
    <div class="main-layout">
      <!-- Left Column: Score + 101 Questions Palette -->
      <aside class="sidebar-panel">
        <!-- Stats Card -->
        <div class="stats-card">
          <div class="stats-grid">
            <div class="stat-items-group">
              <div class="stat-item">
                <div class="stat-icon"><i data-lucide="trophy" style="width:15px; height:15px;"></i></div>
                <div>
                  <div class="stat-label">Điểm số</div>
                  <div class="stat-value"><span id="val-correct">0</span> <span class="stat-value-sub">/ 101</span></div>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon"><i data-lucide="target" style="width:15px; height:15px;"></i></div>
                <div>
                  <div class="stat-label">Đã làm</div>
                  <div class="stat-value"><span id="val-answered">0</span> <span class="stat-value-sub">/ 101</span></div>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon" style="color: var(--color-danger);"><i data-lucide="x-circle" style="width:15px; height:15px;"></i></div>
                <div>
                  <div class="stat-label">Sai</div>
                  <div class="stat-value"><span id="val-wrong">0</span></div>
                </div>
              </div>
            </div>
            <div class="percentage-badge" id="val-percentage">0%</div>
          </div>
          <div class="progress-track">
            <div class="progress-fill" id="progress-bar" style="width: 0%;"></div>
          </div>
        </div>

        <!-- Question Palette Grid -->
        <div class="palette-box">
          <div class="palette-header">
            <div class="palette-title">
              <i data-lucide="layout-grid" style="width:14px; height:14px; color: var(--text-brand);"></i>
              <span>Bảng câu hỏi (1 - 101)</span>
            </div>
            <div class="palette-filters">
              <button class="filter-chip active" data-filter="all">Tất cả</button>
              <button class="filter-chip" data-filter="unanswered">Chưa làm</button>
              <button class="filter-chip" data-filter="correct">Đúng</button>
              <button class="filter-chip" data-filter="wrong">Sai</button>
            </div>
          </div>
          <div class="chips-grid" id="chips-container">
            <!-- Question chips injected by JS -->
          </div>
        </div>
      </aside>

      <!-- Right Column: Question Content, Options, Explanation & Bottom Navigation -->
      <main class="workspace-panel">
        <div class="card-meta">
          <div class="q-index-pill" id="q-index-text">Câu 1 / 101</div>
          <button class="q-reset-btn" id="btn-reset-current" title="Làm lại câu này">
            <i data-lucide="refresh-cw" style="width:12px; height:12px;"></i>
            <span>Làm lại câu này</span>
          </button>
        </div>

        <!-- Scrollable Middle Section -->
        <div class="scroll-content">
          <div class="question-content" id="q-text">Đang tải nội dung câu hỏi...</div>

          <div class="options-list" id="options-container">
            <!-- Options injected by JS -->
          </div>

          <!-- Explanation Panel -->
          <div class="explanation-panel" id="explanation-container" style="display: none;">
            <div id="status-banner" class="status-banner">
              <!-- Status icon + text -->
            </div>

            <div class="explain-block">
              <div class="explain-icon">
                <i data-lucide="book-open" style="width:15px; height:15px;"></i>
              </div>
              <div class="explain-text-wrap">
                <div class="explain-title">Giải thích kỹ thuật (Dễ hiểu cho người mới học)</div>
                <div id="explain-tech-text"></div>
              </div>
            </div>

            <div class="explain-block" id="block-tip">
              <div class="explain-icon tip-icon">
                <i data-lucide="lightbulb" style="width:15px; height:15px;"></i>
              </div>
              <div class="explain-text-wrap">
                <div class="explain-title">Mẹo nhớ nhanh khi đi thi</div>
                <div id="explain-tip-text"></div>
              </div>
            </div>

            <div class="explain-block" id="block-distinguish">
              <div class="explain-icon diff-icon">
                <i data-lucide="split" style="width:15px; height:15px;"></i>
              </div>
              <div class="explain-text-wrap">
                <div class="explain-title">Phân biệt & Bẫy cần tránh</div>
                <div id="explain-distinguish-text"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Fixed Footer inside Workspace -->
        <footer class="workspace-footer">
          <div class="shortcuts-hint">
            <span>Phím: <span class="kbd">A</span> <span class="kbd">B</span> <span class="kbd">C</span> <span class="kbd">D</span></span>
            <span>•</span>
            <span><span class="kbd">←</span> <span class="kbd">→</span></span>
            <span>•</span>
            <span><span class="kbd">R</span> Làm lại</span>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn nav-btn" id="btn-prev">
              <i data-lucide="chevron-left" style="width:15px; height:15px;"></i>
              <span>Câu trước</span>
            </button>
            <button class="btn nav-btn btn-brand" id="btn-next">
              <span>Câu tiếp theo</span>
              <i data-lucide="chevron-right" style="width:15px; height:15px;"></i>
            </button>
          </div>
        </footer>
      </main>
    </div>
  </div>

  <!-- Modal Confirm Reset All -->
  <div class="modal-overlay" id="reset-modal">
    <div class="modal-box">
      <h3 class="modal-title">Làm lại từ đầu?</h3>
      <p class="modal-desc">Toàn bộ tiến độ và kết quả làm bài của 101 câu hỏi sẽ được thiết lập lại từ đầu.</p>
      <div class="modal-actions">
        <button class="btn" id="btn-modal-cancel">Hủy</button>
        <button class="btn btn-brand" id="btn-modal-confirm">Xác nhận làm lại</button>
      </div>
    </div>
  </div>

  <script>
    // --- 101 QUESTIONS DATA ---
    const RAW_QUESTIONS = ` + safeQuestionsJson + `;

    const STORAGE_KEY_ANSWERS = 'quiz_101_answers';
    const STORAGE_KEY_INDEX = 'quiz_101_current_index';
    const STORAGE_KEY_SHUFFLE = 'quiz_101_shuffle_enabled';
    const STORAGE_KEY_THEME = 'quiz_101_theme_mode';

    const LETTERS = ['A', 'B', 'C', 'D'];

    // Seeded shuffle function to keep stable option order per question unless shuffle button toggled
    function seededShuffle(arr, seed) {
      let s = seed % 2147483647;
      if (s <= 0) s += 2147483646;
      const rnd = function() {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
      };
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    // App State
    let currentIndex = 0;
    let userAnswers = {}; // { [questionId]: optionIndex }
    let shuffleSeedOffset = 0;
    let isShuffleMode = false;
    let activeFilter = 'all'; // 'all' | 'unanswered' | 'correct' | 'wrong'
    let currentTheme = 'dark'; // 'dark' | 'light'

    // Load from LocalStorage
    try {
      const savedAnswers = localStorage.getItem(STORAGE_KEY_ANSWERS);
      if (savedAnswers) userAnswers = JSON.parse(savedAnswers);
      const savedIndex = localStorage.getItem(STORAGE_KEY_INDEX);
      if (savedIndex !== null) currentIndex = parseInt(savedIndex, 10) || 0;
      if (currentIndex < 0 || currentIndex >= RAW_QUESTIONS.length) currentIndex = 0;
      isShuffleMode = localStorage.getItem(STORAGE_KEY_SHUFFLE) === 'true';

      const savedTheme = localStorage.getItem(STORAGE_KEY_THEME);
      if (savedTheme === 'light' || savedTheme === 'dark') {
        currentTheme = savedTheme;
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        currentTheme = 'light';
      }
    } catch(e) {
      console.warn('LocalStorage error:', e);
    }

    // DOM Elements
    const htmlElement = document.documentElement;
    const btnThemeToggle = document.getElementById('btn-theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');

    const qIndexText = document.getElementById('q-index-text');
    const qText = document.getElementById('q-text');
    const optionsContainer = document.getElementById('options-container');
    const explanationContainer = document.getElementById('explanation-container');
    const statusBanner = document.getElementById('status-banner');
    const explainTechText = document.getElementById('explain-tech-text');
    const explainTipText = document.getElementById('explain-tip-text');
    const explainDistinguishText = document.getElementById('explain-distinguish-text');
    const blockTip = document.getElementById('block-tip');
    const blockDistinguish = document.getElementById('block-distinguish');

    const valCorrect = document.getElementById('val-correct');
    const valAnswered = document.getElementById('val-answered');
    const valWrong = document.getElementById('val-wrong');
    const valPercentage = document.getElementById('val-percentage');
    const progressBar = document.getElementById('progress-bar');
    const chipsContainer = document.getElementById('chips-container');

    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnResetCurrent = document.getElementById('btn-reset-current');
    const btnResetAll = document.getElementById('btn-reset-all');
    const btnShuffle = document.getElementById('btn-shuffle');

    const resetModal = document.getElementById('reset-modal');
    const btnModalCancel = document.getElementById('btn-modal-cancel');
    const btnModalConfirm = document.getElementById('btn-modal-confirm');

    // Theme Management
    function applyTheme(theme) {
      currentTheme = theme;
      htmlElement.setAttribute('data-theme', theme);
      try {
        localStorage.setItem(STORAGE_KEY_THEME, theme);
      } catch(e) {}

      if (theme === 'light') {
        themeText.textContent = 'Tối';
        themeIcon.setAttribute('data-lucide', 'moon');
      } else {
        themeText.textContent = 'Sáng';
        themeIcon.setAttribute('data-lucide', 'sun');
      }

      if (window.lucide) {
        lucide.createIcons();
      }
    }

    btnThemeToggle.addEventListener('click', () => {
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
    });

    // Build question options list
    function getQuestionOptions(q) {
      const baseList = [
        { text: q.correct, isCorrect: true },
        ...q.wrongs.map(w => ({ text: w, isCorrect: false }))
      ];
      if (isShuffleMode) {
        return seededShuffle(baseList, (q.id * 41 + 17 + shuffleSeedOffset));
      } else {
        return seededShuffle(baseList, (q.id * 37 + 11));
      }
    }

    // Render Stats
    function updateStats() {
      const total = RAW_QUESTIONS.length;
      let correctCount = 0;
      let wrongCount = 0;
      let answeredCount = 0;

      RAW_QUESTIONS.forEach(q => {
        const pickedIdx = userAnswers[q.id];
        if (pickedIdx !== undefined) {
          answeredCount++;
          const opts = getQuestionOptions(q);
          if (opts[pickedIdx] && opts[pickedIdx].isCorrect) {
            correctCount++;
          } else {
            wrongCount++;
          }
        }
      });

      valCorrect.textContent = correctCount;
      valAnswered.textContent = answeredCount;
      valWrong.textContent = wrongCount;

      const pct = answeredCount > 0 ? Math.round((correctCount / total) * 100) : 0;
      valPercentage.textContent = pct + '%';
      progressBar.style.width = ((answeredCount / total) * 100) + '%';

      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY_ANSWERS, JSON.stringify(userAnswers));
        localStorage.setItem(STORAGE_KEY_INDEX, currentIndex.toString());
      } catch(e) {}
    }

    // Render Palette Chips
    function renderPalette() {
      chipsContainer.innerHTML = '';
      RAW_QUESTIONS.forEach((q, idx) => {
        const picked = userAnswers[q.id];
        const isAnswered = picked !== undefined;
        let isCorrect = false;
        if (isAnswered) {
          const opts = getQuestionOptions(q);
          isCorrect = opts[picked] && opts[picked].isCorrect;
        }

        // Apply filters
        let visible = true;
        if (activeFilter === 'unanswered' && isAnswered) visible = false;
        if (activeFilter === 'correct' && (!isAnswered || !isCorrect)) visible = false;
        if (activeFilter === 'wrong' && (!isAnswered || isCorrect)) visible = false;

        const chip = document.createElement('button');
        chip.className = 'q-chip';
        chip.textContent = q.id;
        chip.setAttribute('title', 'Câu ' + q.id);

        if (idx === currentIndex) chip.classList.add('active');
        if (isAnswered) {
          if (isCorrect) chip.classList.add('correct');
          else chip.classList.add('wrong');
        }

        if (!visible) {
          chip.style.display = 'none';
        }

        chip.addEventListener('click', () => {
          goToQuestion(idx);
        });

        chipsContainer.appendChild(chip);
      });
    }

    // Render Current Question
    function renderCurrentQuestion() {
      const q = RAW_QUESTIONS[currentIndex];
      const options = getQuestionOptions(q);
      const pickedIdx = userAnswers[q.id];
      const isAnswered = pickedIdx !== undefined;

      qIndexText.textContent = 'Câu ' + q.id + ' / ' + RAW_QUESTIONS.length;
      qText.textContent = q.question;

      // Render Options
      optionsContainer.innerHTML = '';
      options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.disabled = isAnswered;

        const isUserPick = pickedIdx === idx;

        if (isAnswered) {
          if (opt.isCorrect) {
            btn.classList.add('state-correct');
          } else if (isUserPick && !opt.isCorrect) {
            btn.classList.add('state-wrong');
          } else {
            btn.classList.add('state-dim');
          }
        }

        const letterBox = document.createElement('div');
        letterBox.className = 'option-letter';
        letterBox.textContent = LETTERS[idx] || (idx + 1);

        const textSpan = document.createElement('div');
        textSpan.className = 'option-text';
        textSpan.textContent = opt.text;

        const iconBox = document.createElement('div');
        iconBox.className = 'option-icon';
        if (isAnswered && opt.isCorrect) {
          iconBox.innerHTML = '<i data-lucide="check" style="width:16px; height:16px; color: var(--color-success);"></i>';
        } else if (isAnswered && isUserPick && !opt.isCorrect) {
          iconBox.innerHTML = '<i data-lucide="x" style="width:16px; height:16px; color: var(--color-danger);"></i>';
        }

        btn.appendChild(letterBox);
        btn.appendChild(textSpan);
        btn.appendChild(iconBox);

        btn.addEventListener('click', () => {
          if (userAnswers[q.id] === undefined) {
            userAnswers[q.id] = idx;
            updateStats();
            renderCurrentQuestion();
            renderPalette();
          }
        });

        optionsContainer.appendChild(btn);
      });

      // Render Explanation
      if (isAnswered) {
        const isCorrect = options[pickedIdx] && options[pickedIdx].isCorrect;
        explanationContainer.style.display = 'flex';

        statusBanner.className = 'status-banner ' + (isCorrect ? 'is-correct' : 'is-wrong');
        statusBanner.innerHTML = isCorrect
          ? '<i data-lucide="check-circle-2" style="width:16px; height:16px;"></i> <span>Chính xác! Làm rất tốt.</span>'
          : '<i data-lucide="alert-circle" style="width:16px; height:16px;"></i> <span>Chưa chính xác. Xem kỹ lời giải dưới đây.</span>';

        explainTechText.innerHTML = q.explanation;

        if (q.tip) {
          blockTip.style.display = 'flex';
          explainTipText.textContent = q.tip;
        } else {
          blockTip.style.display = 'none';
        }

        if (q.distinguish) {
          blockDistinguish.style.display = 'flex';
          explainDistinguishText.textContent = q.distinguish;
        } else {
          blockDistinguish.style.display = 'none';
        }
      } else {
        explanationContainer.style.display = 'none';
      }

      // Update Nav Buttons
      btnPrev.disabled = currentIndex === 0;
      btnNext.disabled = currentIndex === RAW_QUESTIONS.length - 1;

      // Scroll active chip into view inside palette
      const activeChip = chipsContainer.children[currentIndex];
      if (activeChip) {
        activeChip.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
      }

      // Re-initialize Lucide icons
      if (window.lucide) {
        lucide.createIcons();
      }
    }

    function goToQuestion(index) {
      if (index >= 0 && index < RAW_QUESTIONS.length) {
        currentIndex = index;
        renderCurrentQuestion();
        renderPalette();
      }
    }

    // Event Listeners
    btnPrev.addEventListener('click', () => goToQuestion(currentIndex - 1));
    btnNext.addEventListener('click', () => goToQuestion(currentIndex + 1));

    btnResetCurrent.addEventListener('click', () => {
      const q = RAW_QUESTIONS[currentIndex];
      delete userAnswers[q.id];
      updateStats();
      renderCurrentQuestion();
      renderPalette();
    });

    btnResetAll.addEventListener('click', () => {
      resetModal.classList.add('open');
    });

    btnModalCancel.addEventListener('click', () => {
      resetModal.classList.remove('open');
    });

    btnModalConfirm.addEventListener('click', () => {
      userAnswers = {};
      currentIndex = 0;
      updateStats();
      renderCurrentQuestion();
      renderPalette();
      resetModal.classList.remove('open');
    });

    btnShuffle.addEventListener('click', () => {
      isShuffleMode = !isShuffleMode;
      shuffleSeedOffset = Math.floor(Math.random() * 1000) + 1;
      localStorage.setItem(STORAGE_KEY_SHUFFLE, isShuffleMode.toString());
      if (isShuffleMode) {
        btnShuffle.classList.add('btn-brand');
        btnShuffle.querySelector('span').textContent = 'Đang xáo';
      } else {
        btnShuffle.classList.remove('btn-brand');
        btnShuffle.querySelector('span').textContent = 'Xáo đáp án';
      }
      renderCurrentQuestion();
      renderPalette();
    });

    // Palette filter buttons
    document.querySelectorAll('.filter-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.getAttribute('data-filter');
        renderPalette();
      });
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (resetModal.classList.contains('open')) {
        if (e.key === 'Escape') resetModal.classList.remove('open');
        return;
      }

      // Ignore when user is pressing shortcut combinations like Ctrl+C, Ctrl+A, Cmd+C...
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const key = e.key.toUpperCase();
      const q = RAW_QUESTIONS[currentIndex];

      // Options A, B, C, D or 1, 2, 3, 4
      let optIdx = -1;
      if (key === 'A' || key === '1') optIdx = 0;
      else if (key === 'B' || key === '2') optIdx = 1;
      else if (key === 'C' || key === '3') optIdx = 2;
      else if (key === 'D' || key === '4') optIdx = 3;

      if (optIdx !== -1 && userAnswers[q.id] === undefined) {
        userAnswers[q.id] = optIdx;
        updateStats();
        renderCurrentQuestion();
        renderPalette();
        return;
      }

      if (e.key === 'ArrowLeft') {
        goToQuestion(currentIndex - 1);
      } else if (e.key === 'ArrowRight') {
        goToQuestion(currentIndex + 1);
      } else if (key === 'R') {
        delete userAnswers[q.id];
        updateStats();
        renderCurrentQuestion();
        renderPalette();
      }
    });

    // Initialize
    applyTheme(currentTheme);
    if (isShuffleMode) {
      btnShuffle.classList.add('btn-brand');
      btnShuffle.querySelector('span').textContent = 'Đang xáo';
    }
    updateStats();
    renderCurrentQuestion();
    renderPalette();
  </script>
</body>
</html>`;

const targetWorkspace = path.join(__dirname, '..', 'index.html');
const targetDownloads = 'C:/Users/TMS/Downloads/Web_Quiz.html';

fs.writeFileSync(targetWorkspace, html, 'utf8');
console.log('Saved to workspace:', targetWorkspace);

try {
  fs.writeFileSync(targetDownloads, html, 'utf8');
  console.log('Saved to Downloads:', targetDownloads);
} catch (err) {
  console.warn('Could not write to downloads:', err.message);
}
