const Accounts = require ("../model/accounts.model.js");
const User = require ("../model/user.model.js");


module.exports.home = async (req, res) => {
  res.render("homeFirst/homeFirst.pug", {
    title: "Trang quản lý cơ sở hạ tầng"
  });
};

module.exports.signUp = (req, res) => {
  res.render("homeFirst/signUp.pug", {
    title: "Sign Up Page"
  });
};

module.exports.signUpPost = async (req, res) => {
  try {
    const { name, email, password, address, avatar } = req.body;
    const account_type = "User"; 

    // Check if the email already exists
    const existingAccount = await Accounts.findOne({ where: { email } });
    if (existingAccount) {
      return res.status(400).json({ message: "Email đã tồn tại" });
    }

    // Create the new account
    const account = await Accounts.create({
      email,
      password, 
      avatar,
      account_type,
      status: "Active", // Set the default status
    });
    
    // After creating account, create the new user
    const user = await User.create({
      name,
      account_id: account.account_id, 
      address,
      avatar,
      user_id: `user_${account.account_id}` 
    });

    // Return user home
    return res.redirect(`/user/home/${account.account_id}`);
  } catch (error) {
    console.error("Error creating account or user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.signIn = (req, res) => {
  res.render("homeFirst/signIn.pug", {
    title: "Sign In Page"
  });
};

module.exports.signInPost = async (req, res) => {
  console.log(req.body);
  const { email, password } = req.body;
  try {
    const account = await Accounts.findOne({ where: { email } });

    if (!account) {
      req.flash('error', 'Email không tồn tại');
      return res.redirect('back');
    }

    if (password !== account.password) {
      req.flash('error', 'Sai mật khẩu');
      return res.redirect('back');
    }

    if (account.status == "Inactive") {
      req.flash('error', 'Tài khoản của bạn đã bị khóa');
      return res.redirect('back');
    }

    req.session.accountId = account.account_id;

    switch (account.account_type) {
      case 'Admin':
        return res.redirect(`/admin/home/${account.account_id}`);
      case 'User':
        return res.redirect(`/user/home/${account.account_id}`);
      case 'Technician':
        return res.redirect(`/tech/home/${account.account_id}`);
      default:
        req.flash('error', 'Loại tài khoản không hợp lệ');
        return res.redirect('back');
    }
  } catch (error) {
    console.error(error);
    req.flash('error', 'Lỗi server');
    return res.redirect('back');
  }
};


module.exports.validationPassword = async (req, res) => {
  try {
    const { currentPassword } = req.body;
    const userId = req.params.id; // Lấy ID người dùng từ session hoặc token

    // Tìm tài khoản trong cơ sở dữ liệu
    const account = await Account.findOne({ where: { id: userId } });

    if (!account) {
      return res.status(404).json({ isValid: false, message: "User not found" });
    }

    // So sánh mật khẩu cũ
    if (currentPassword === account.password) {
      return res.status(200).json({ isValid: true });
    } else {
      return res.status(400).json({ isValid: false, message: "Incorrect password" });
    }
  } catch (error) {
    console.error("Error validating password:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};