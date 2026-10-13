/**
 * LibraryOS - Modern Personal Library Client
 * Fully complies with FreeCodeCamp QA specifications and DOM contracts
 */

$(document).ready(function() {
  let itemsRaw = [];
  let currentSelectedBookId = null;

  // --- Theme Management ---
  const savedTheme = localStorage.getItem('libraryos-theme') || 'dark';
  applyTheme(savedTheme);

  $('#themeToggleBtn').click(function() {
    const currentTheme = $('html').attr('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
  });

  function applyTheme(theme) {
    $('html').attr('data-theme', theme);
    localStorage.setItem('libraryos-theme', theme);
    if (theme === 'light') {
      $('#themeMoonIcon').hide();
      $('#themeSunIcon').show();
    } else {
      $('#themeMoonIcon').show();
      $('#themeSunIcon').hide();
    }
  }

  // --- Toast Notifications ---
  function showToast(message, type = 'info') {
    const $toast = $('<div class="toast"/>').text(message);
    if (type === 'error') {
      $toast.css('border-color', 'var(--accent-rose)').css('color', 'var(--accent-rose)');
    } else if (type === 'success') {
      $toast.css('border-color', 'var(--accent-emerald)').css('color', 'var(--accent-emerald)');
    }
    $('#toastContainer').append($toast);
    setTimeout(function() {
      $toast.fadeOut(300, function() {
        $(this).remove();
      });
    }, 3000);
  }

  // Generate Deterministic Professional Theme & Initials for Book Avatar
  function getBookCoverStyle(title) {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    const palettes = [
      { gradient: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)', badge: 'rgba(59, 130, 246, 0.15)', text: '#60A5FA' }, // Sapphire
      { gradient: 'linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)', badge: 'rgba(20, 184, 166, 0.15)', text: '#2DD4BF' }, // Deep Teal
      { gradient: 'linear-gradient(135deg, #3730A3 0%, #6366F1 100%)', badge: 'rgba(99, 102, 241, 0.15)', text: '#818CF8' }, // Indigo
      { gradient: 'linear-gradient(135deg, #065F46 0%, #10B981 100%)', badge: 'rgba(16, 185, 129, 0.15)', text: '#34D399' }, // Emerald
      { gradient: 'linear-gradient(135deg, #334155 0%, #64748B 100%)', badge: 'rgba(100, 116, 139, 0.15)', text: '#94A3B8' }, // Slate Steel
      { gradient: 'linear-gradient(135deg, #854D0E 0%, #D97706 100%)', badge: 'rgba(217, 119, 6, 0.15)', text: '#FBBF24' },  // Polished Bronze
      { gradient: 'linear-gradient(135deg, #1E3A8A 0%, #0284C7 100%)', badge: 'rgba(2, 132, 199, 0.15)', text: '#38BDF8' }   // Cobalt Cyan
    ];
    const index = Math.abs(hash) % palettes.length;
    const initial = title.trim().charAt(0).toUpperCase() || 'B';
    return {
      gradient: palettes[index].gradient,
      badge: palettes[index].badge,
      textColor: palettes[index].text,
      initial: initial
    };
  }

  // Update Header Totals
  function updateHeaderStats(data) {
    const totalBooks = data.length;
    let totalComments = 0;
    data.forEach(function(b) {
      totalComments += (b.commentcount || 0);
    });

    $('#headerTotalBooks').text(totalBooks + (totalBooks === 1 ? ' Book' : ' Books'));
    $('#headerTotalComments').text(totalComments + (totalComments === 1 ? ' Note' : ' Notes'));
    $('#catalogCounterBadge').text(totalBooks + (totalBooks === 1 ? ' Book' : ' Books'));
  }

  // Load and Render Books
  function loadBooks(selectedIdToKeep = null) {
    $.getJSON('/api/books', function(data) {
      itemsRaw = data;
      updateHeaderStats(data);

      if (!data || data.length === 0) {
        $('#display').html(
          '<div class="empty-state">' +
            '<svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>' +
            '<p style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem;">Collection is empty</p>' +
            '<p style="font-size: 0.85rem;">Create your first book above to begin.</p>' +
          '</div>'
        );
        resetDetailView();
        return;
      }

      renderFilteredBooks(data, selectedIdToKeep);
    }).fail(function() {
      $('#display').html(
        '<div class="empty-state">' +
          '<p>Unable to connect to database. Ensure server is online.</p>' +
        '</div>'
      );
    });
  }

  // Filter and display books
  function renderFilteredBooks(data, selectedIdToKeep = null) {
    const searchTerm = ($('#catalogSearchInput').val() || '').toLowerCase().trim();
    const items = [];

    $.each(data, function(i, val) {
      if (searchTerm && !val.title.toLowerCase().includes(searchTerm)) {
        return;
      }

      const isSelected = selectedIdToKeep && (val._id === selectedIdToKeep);
      const activeClass = isSelected ? ' active' : '';
      const cover = getBookCoverStyle(val.title);

      items.push(
        '<li class="bookItem' + activeClass + '" id="' + i + '" data-bookid="' + val._id + '">' +
          '<div class="book-item-content">' +
            '<div class="book-avatar" style="background: ' + cover.gradient + ';">' + cover.initial + '</div>' +
            '<div class="book-info">' +
              '<div class="book-item-title">' + escapeHtml(val.title) + '</div>' +
            '</div>' +
          '</div>' +
          '<span class="book-comment-tag">' +
            '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> ' +
            val.commentcount +
          '</span>' +
        '</li>'
      );
    });

    if (items.length === 0) {
      $('#display').html(
        '<div class="empty-state">' +
          '<p>No books matching "' + escapeHtml(searchTerm) + '"</p>' +
        '</div>'
      );
      return;
    }

    const $ul = $('<ul/>', {
      class: 'listWrapper',
      html: items.join('')
    });

    $('#display').empty().append($ul);

    if (selectedIdToKeep) {
      const idx = data.findIndex(b => b._id === selectedIdToKeep);
      if (idx !== -1) {
        openBookDetail(idx);
      }
    }
  }

  // Open Book Detail by Index
  function openBookDetail(index) {
    if (!itemsRaw[index]) return;
    const selectedBook = itemsRaw[index];
    currentSelectedBookId = selectedBook._id;

    // Highlight active in list
    $('.bookItem').removeClass('active');
    $('.bookItem[data-bookid="' + selectedBook._id + '"]').addClass('active');

    // UI state transitions
    $('#emptyDetailPlaceholder').hide();
    $('#activeBookView').show();
    $('#readingRoomStatusBadge').text('Active Volume');

    // Canonical FCC ID #detailTitle format
    $('#detailTitle').html('<b>' + escapeHtml(selectedBook.title) + '</b> (id: ' + selectedBook._id + ')');
    $('#activeBookTitleDisplay').text(selectedBook.title);
    $('#activeBookIdDisplay').text(selectedBook._id);

    // Fetch full book details with comments
    $.getJSON('/api/books/' + selectedBook._id, function(data) {
      const comments = [];
      const commentList = data.comments || [];

      if (commentList.length === 0) {
        comments.push('<li class="no-comments-msg">No discussion notes yet. Leave the first note below!</li>');
      } else {
        $.each(commentList, function(i, val) {
          comments.push(
            '<li>' +
              '<span class="comment-bullet"></span>' +
              '<span>' + escapeHtml(val) + '</span>' +
            '</li>'
          );
        });
      }

      // Canonical FCC form & buttons structure inside #detailComments container
      comments.push(
        '<div style="margin-top: 1.4rem; padding-top: 1.25rem; border-top: 1px solid var(--border-subtle);">' +
          '<form id="newCommentForm" onsubmit="return false;" class="comment-input-wrap">' +
            '<label class="form-label" for="commentToAdd">New Comment</label>' +
            '<div class="input-icon-wrap">' +
              '<svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>' +
              '<input style="width:100%" type="text" class="modern-input form-control" id="commentToAdd" name="comment" placeholder="Write a comment..." autocomplete="off">' +
            '</div>' +
          '</form>' +
          '<div class="detail-actions-row">' +
            '<button class="btn-modern-primary addComment" id="' + data._id + '">' +
              '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg> ' +
              'Add Comment' +
            '</button>' +
            '<button class="btn-modern-danger deleteBook" id="' + data._id + '">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> ' +
              'Delete Book' +
            '</button>' +
          '</div>' +
        '</div>'
      );

      $('#detailComments').html(comments.join(''));
    }).fail(function() {
      showToast('Could not load book comments', 'error');
    });
  }

  // Reset Detail View
  function resetDetailView() {
    currentSelectedBookId = null;
    $('#activeBookView').hide();
    $('#emptyDetailPlaceholder').show();
    $('#detailTitle').text("Select a book to see it's details and comments");
    $('#detailComments').empty();
    $('#readingRoomStatusBadge').text('No Selection');
    $('.bookItem').removeClass('active');
  }

  // Select Book Item Click
  $('#display').on('click', 'li.bookItem', function() {
    openBookDetail(this.id);
  });

  // Add Comment Handler
  $('#bookDetail').on('click', 'button.addComment', function(e) {
    e.preventDefault();
    const bookId = this.id;
    const commentVal = $('#commentToAdd').val();

    if (!commentVal || !commentVal.trim()) {
      showToast('Comment text cannot be empty', 'error');
      $('#commentToAdd').focus();
      return;
    }

    const $btn = $(this);
    $btn.prop('disabled', true).text('Posting...');

    $.ajax({
      url: '/api/books/' + bookId,
      type: 'post',
      dataType: 'json',
      data: $('#newCommentForm').serialize(),
      success: function(data) {
        showToast('Comment posted successfully!', 'success');
        loadBooks(bookId);
      },
      error: function(xhr) {
        showToast(xhr.responseText || 'Error adding comment', 'error');
        $btn.prop('disabled', false).text('Add Comment');
      }
    });
  });

  // Delete Single Book Handler
  $('#bookDetail').on('click', 'button.deleteBook', function(e) {
    e.preventDefault();
    const bookId = this.id;
    const bookTitle = $('#activeBookTitleDisplay').text() || 'this book';

    if (!confirm('Are you sure you want to delete "' + bookTitle + '"?')) {
      return;
    }

    const $btn = $(this);
    $btn.prop('disabled', true).text('Deleting...');

    $.ajax({
      url: '/api/books/' + bookId,
      type: 'delete',
      success: function(response) {
        showToast(response || 'Book deleted successfully', 'success');
        resetDetailView();
        loadBooks();
      },
      error: function(xhr) {
        showToast(xhr.responseText || 'Error deleting book', 'error');
        $btn.prop('disabled', false).text('Delete Book');
      }
    });
  });

  // Submit New Book Form
  function submitNewBook() {
    const titleVal = $('#bookTitleToAdd').val();
    if (!titleVal || !titleVal.trim()) {
      showToast('Please enter a book title', 'error');
      $('#bookTitleToAdd').focus();
      return;
    }

    const $btn = $('#newBook');
    $btn.prop('disabled', true).text('Creating...');

    $.ajax({
      url: '/api/books',
      type: 'post',
      dataType: 'json',
      data: $('#newBookForm').serialize(),
      success: function(newBook) {
        $('#bookTitleToAdd').val('');
        $btn.prop('disabled', false).html(
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> Create Book'
        );
        showToast('Added "' + newBook.title + '" to collection!', 'success');
        loadBooks(newBook._id);
      },
      error: function(xhr) {
        $btn.prop('disabled', false).text('Create Book');
        showToast(xhr.responseText || 'Error creating book', 'error');
      }
    });
  }

  $('#newBook').click(function(e) {
    e.preventDefault();
    submitNewBook();
  });

  $('#newBookForm').submit(function(e) {
    e.preventDefault();
    submitNewBook();
  });

  // Delete All Books Handler
  $('#deleteAllBooks').click(function(e) {
    e.preventDefault();
    if (!itemsRaw || itemsRaw.length === 0) {
      showToast('Collection is already empty.', 'info');
      return;
    }

    if (!confirm('Are you sure you want to delete ALL books? This action cannot be undone.')) {
      return;
    }

    const $btn = $(this);
    $btn.prop('disabled', true).text('Deleting...');

    $.ajax({
      url: '/api/books',
      type: 'delete',
      success: function(response) {
        showToast(response || 'All books deleted successfully', 'success');
        resetDetailView();
        loadBooks();
        $btn.prop('disabled', false).text('Delete All Books');
      },
      error: function(xhr) {
        showToast(xhr.responseText || 'Error deleting all books', 'error');
        $btn.prop('disabled', false).text('Delete All Books');
      }
    });
  });

  // Search Filter Input
  $('#catalogSearchInput').on('input', function() {
    renderFilteredBooks(itemsRaw, currentSelectedBookId);
  });

  // Copy ID Chip
  $('#copyIdChip').click(function() {
    const id = $('#activeBookIdDisplay').text();
    if (id && navigator.clipboard) {
      navigator.clipboard.writeText(id).then(function() {
        showToast('ID copied to clipboard!', 'success');
      });
    }
  });

  // Navigation Tab Switching
  $('.nav-tab-btn').click(function() {
    const tabName = $(this).data('tab');
    $('.nav-tab-btn').removeClass('active');
    $(this).addClass('active');

    $('.tab-pane').removeClass('active');
    $('#' + tabName + 'Tab').addClass('active');
  });

  // Interactive Console Quick Actions
  $('#consoleGetBooksBtn').click(function() {
    $('#consoleEndpointInput').val('/api/books');
    executeConsoleRequest('GET', '/api/books');
  });

  $('#consoleDeleteAllBtn').click(function() {
    if (confirm('Execute DELETE /api/books from console?')) {
      $('#consoleEndpointInput').val('/api/books');
      executeConsoleRequest('DELETE', '/api/books');
    }
  });

  $('#consoleSendBtn').click(function() {
    const endpoint = $('#consoleEndpointInput').val().trim();
    executeConsoleRequest('GET', endpoint);
  });

  function executeConsoleRequest(method, endpoint) {
    $('#consoleResponseStatus').text('Executing...');
    $('#consoleOutputTerminal').text('// Contacting server at ' + endpoint + '...');

    const startTime = performance.now();
    $.ajax({
      url: endpoint,
      type: method,
      complete: function(xhr) {
        const duration = Math.round(performance.now() - startTime);
        $('#consoleResponseStatus').text(xhr.status + ' ' + xhr.statusText + ' (' + duration + 'ms)');

        let formattedOutput;
        try {
          const parsed = JSON.parse(xhr.responseText);
          formattedOutput = JSON.stringify(parsed, null, 2);
        } catch (e) {
          formattedOutput = xhr.responseText || '(Empty Response Body)';
        }

        const headerStr = '// HTTP ' + xhr.status + ' ' + xhr.statusText + ' [' + duration + 'ms]\n\n';
        $('#consoleOutputTerminal').text(headerStr + formattedOutput);
      }
    });
  }

  // QA Test Runner Live Fetch
  $('#runQaTestsBtn').click(function() {
    const $btn = $(this);
    $btn.prop('disabled', true).text('Querying Test Runner...');

    $.getJSON('/_api/get-tests?type=functional', function(tests) {
      $btn.prop('disabled', false).html(
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Refresh Test Report'
      );

      $('#testRunnerReportContainer').slideDown();

      if (!Array.isArray(tests) || tests.length === 0) {
        $('#testItemsList').html('<p style="color: var(--text-muted);">No functional tests found. Ensure NODE_ENV=test.</p>');
        return;
      }

      const passedCount = tests.filter(t => t.state === 'passed').length;
      $('#testSummaryBadge').text(passedCount + ' / ' + tests.length + ' Passing');

      const rows = tests.map(function(t, idx) {
        return (
          '<div class="test-row">' +
            '<div>' +
              '<strong>#' + (idx + 1) + ' ' + escapeHtml(t.title) + '</strong><br>' +
              '<span style="font-size: 0.78rem; color: var(--text-muted);">' + escapeHtml(t.context || '') + ' (' + (t.assertions ? t.assertions.length : 0) + ' assertions)</span>' +
            '</div>' +
            '<span class="badge-pass">' + escapeHtml(t.state ? t.state.toUpperCase() : 'PASS') + '</span>' +
          '</div>'
        );
      });

      $('#testItemsList').html(rows.join(''));
      showToast('Test report loaded: ' + passedCount + '/' + tests.length + ' passing!', 'success');
    }).fail(function() {
      $btn.prop('disabled', false).text('Fetch Live Test Runner Report');
      showToast('Could not fetch test report. Check server logs.', 'error');
    });
  });

  // HTML Entity Escaping Helper
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Initial Load
  loadBooks();
});
